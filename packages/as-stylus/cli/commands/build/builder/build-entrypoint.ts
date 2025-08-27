import path from "path";
import { AbiStateMutability, toFunctionSelector, toFunctionSignature } from "viem";

import { AbiType, AbiInput, Visibility, StateMutability } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod, IRStruct } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";
import { getUserEntrypointTemplate } from "@/templates/entrypoint.js";

import { convertType } from "./build-abi.js";
import { SymbolTableStack } from "../analyzers/shared/symbol-table.js";
import { generateArgsLoadBlock } from "../transformers/utils/args.js";

const INDENTATION = {
  BODY: "    ",
  BLOCK: "  ",
} as const;

// Types
interface EntrypointResult {
  imports: string;
  entrypointBody: string;
}

interface CodeBlock {
  imports: string[];
  entries: string[];
}

/**
 * Extracts the struct name from a full type that might include import paths
 * Example: "import(...).StructTest" -> "StructTest"
 */
function extractStructName(fullType: string): string {
  // If it's an import path, extract only the final name
  if (fullType.includes(").")) {
    const parts = fullType.split(").");
    return parts[parts.length - 1];
  }

  // If it's just the name, return it as is
  return fullType;
}

// Helper function to validate inputs
function validateMethod(method: IRMethod): void {
  if (!method.name) {
    throw new Error("Method name is required");
  }
  if (!method.visibility) {
    throw new Error(`Method ${method.name} must have visibility`);
  }
}

function validateContract(contract: IRContract): void {
  if (!contract.methods) {
    throw new Error("Contract must have methods array");
  }

  contract.methods.forEach(validateMethod);
}

function getFunctionSelector(symbolTable: SymbolTableStack, method: IRMethod): string {
  const { name, inputs, outputs = [] } = method;

  const signature = toFunctionSignature({
    name,
    type: "function",
    stateMutability: method.stateMutability as AbiStateMutability,
    inputs: inputs.map((input) => ({
      name: input.name,
      type: convertType(symbolTable, input.type),
    })),
    outputs: outputs.map((output) => ({
      name: output.name,
      type: convertType(symbolTable, output.type),
    })),
  });

  return toFunctionSelector(signature);
}

function generateStringReturnLogic(methodName: string, callArgs: Array<{ name: string }>): string {
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  return [
    `const buf = Str.toABI(${methodName}(${argsList}));`,
    `const size = Str.getABISize(buf);`,
    `write_result(buf, size);`,
    `return 0;`,
  ].join(`\n${INDENTATION.BODY}`);
}

function generateStructReturnLogic(
  methodName: string,
  callArgs: Array<{ name: string }>,
  structInfo: IRStruct,
): string {
  const { dynamic, size } = structInfo;
  let callLine = "";

  const argsList = callArgs.map(arg => arg.name).join(", ");
  if (dynamic) {
    callLine = [
      `const structPtr = ${methodName}(${argsList});`,
      `const strLen   = loadU32BE(structPtr + 160 + 28);`,
      `const padded   = ((strLen + 31) & ~31);`,
      `const tupleSz  = 160 + 32 + padded;`,
      `const resultPtr = malloc(tupleSz + 32);`,
      `store<u8>(resultPtr + 31, 0x20);`,
      `memory.copy(resultPtr + 32, structPtr, tupleSz);`,
      `write_result(resultPtr, tupleSz + 32);`,
      `return 0;`,
    ].join("\n    ");
  } else {
    callLine = [
      `const ptr = ${methodName}(${argsList});`,
      `write_result(ptr, ${size});`,
      `return 0;`,
    ].join("\n    ");
  }

  return callLine;
}

function generateReturnLogic(
  methodName: string,
  callArgs: Array<{ name: string }>,
  outputType: AbiType | string,
  contract: IRContract,
): string {
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  if (outputType === AbiType.String) {
    return generateStringReturnLogic(methodName, callArgs);
  }

  const structName = extractStructName(outputType);
  const structInfo = contract.structs?.find((s) => s.name === structName);

  if (structInfo) {
    return generateStructReturnLogic(methodName, callArgs, structInfo);
  }
  if (outputType === AbiType.Bool) {
    return `let ptr = Boolean.create(${methodName}(${argsList})); write_result(ptr, 32); return 0;`;
  }

  const size = getReturnSize(outputType as AbiType);
  return `let ptr = ${methodName}(${argsList}); write_result(ptr, ${size}); return 0;`;
}

function generateMethodCallLogic(
  method: IRMethod,
  callArgs: Array<{ name: string }>,
  contract: IRContract,
): string {
  const { name } = method;
  const outputType =
    method.outputs?.[0]?.type !== "struct"
      ? method.outputs?.[0]?.type
      : method.outputs?.[0]?.originalType;
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  if (!outputType || outputType === AbiType.Void || outputType === AbiType.Any) {
    return `${name}(${argsList}); return 0;`;
  }

  return generateReturnLogic(name, callArgs, outputType, contract);
}

function generateMethodEntry(
  method: IRMethod,
  contract: IRContract,
): { import: string; entry: string } {
  validateMethod(method);

  const { name, visibility } = method;

  if (!Object.values(Visibility).includes(visibility as Visibility)) {
    throw new Error(`Method ${name} has invalid visibility: ${visibility}`);
  }

  const selector = getFunctionSelector(contract.symbolTable, method);
  const importStatement = `import { ${name} } from "./${contract.path}.transformed";`;

  const { argLines, callArgs } = generateArgsLoadBlock(method.inputs);
  const callLogic = generateMethodCallLogic(method, callArgs, contract);

  const bodyLines = [...argLines, callLogic].map((line) => `${INDENTATION.BODY}${line}`).join("\n");

  const entry = `${INDENTATION.BLOCK}if (selector == ${selector}) {\n${bodyLines}\n${INDENTATION.BLOCK}}`;

  return { import: importStatement, entry };
}

function generateConstructorEntry(
  contractName: string,
  constructor: { inputs: AbiInput[] },
  contractPath: string,
  symbolTable: SymbolTableStack,
): { imports: string[]; entry: string } {
  const { inputs } = constructor;

  const { argLines, callArgs } = generateArgsLoadBlock(inputs);

  const deployMethod: IRMethod = {
    name: `${contractName}_constructor`,
    visibility: Visibility.PUBLIC,
    stateMutability: StateMutability.NONPAYABLE,
    inputs: inputs.map((input) => ({
      name: input.name,
    type: convertType(symbolTable, input.type),
    })),
    outputs: [],
    ir: [],
  };

  const deploySig = getFunctionSelector(symbolTable, deployMethod);
  const imports = [`import { ${contractName}_constructor } from "./${contractPath}.transformed";`];

  const callLine = `${contractName}_constructor(${callArgs.map((arg) => arg.name).join(", ")}); return 0;`;
  const bodyLines = [...argLines, callLine]
    .map((line) => `${INDENTATION.BODY}${line}`)
    .filter((line) => line.trim() !== "")
    .join("\n");

  const entry = `${INDENTATION.BLOCK}if (selector == ${deploySig}) {\n${bodyLines}\n${INDENTATION.BLOCK}}`;

  return { imports, entry };
}

function processContractMethods(contract: IRContract): CodeBlock {
  const imports: string[] = [];
  const entries: string[] = [];
  for (const method of contract.methods) {
    if (
      [Visibility.PUBLIC, Visibility.EXTERNAL, StateMutability.NONPAYABLE].includes(
        method.visibility,
      )
    ) {
      try {
        const { import: methodImport, entry } = generateMethodEntry(method, contract);
        imports.push(methodImport);
        entries.push(entry);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Error processing method ${method.name}: ${message}`);
      }
    }
  }

  return { imports, entries };
}

function processConstructor(contract: IRContract): CodeBlock {
  if (!contract.constructor) {
    return { imports: [], entries: [] };
  }

  try {
    const { imports, entry } = generateConstructorEntry(
      contract.name,
      contract.constructor,
      contract.path,
      contract.symbolTable,
    );
    return { imports, entries: [entry] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error processing constructor: ${message}`);
  }
}

export function generateUserEntrypoint(contract: IRContract): EntrypointResult {
  try {
    validateContract(contract);

    const methodsResult = processContractMethods(contract);
    const constructorResult = processConstructor(contract);

    const allImports = [...methodsResult.imports, ...constructorResult.imports];
    const allEntries = [...methodsResult.entries, ...constructorResult.entries];

    return {
      imports: allImports.join("\n"),
      entrypointBody: allEntries.join("\n"),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate user entrypoint: ${message}`);
  }
}

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  if (!userFilePath) {
    throw new Error("User file path is required");
  }

  try {
    const { imports, entrypointBody } = generateUserEntrypoint(contract);
    const contractBasePath = path.dirname(userFilePath);

    let indexTemplate = getUserEntrypointTemplate();
    indexTemplate = indexTemplate.replace("// @logic_imports", imports);
    indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

    const outputPath = path.join(contractBasePath, `${contract.path}.entrypoint.ts`);
    writeFile(outputPath, indexTemplate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build entrypoint for ${userFilePath}: ${message}`);
  }
}
