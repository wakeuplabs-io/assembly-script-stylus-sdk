import path from "path";
import { AbiStateMutability, toFunctionSelector, toFunctionSignature } from "viem";

import { AbiType, AbiInput, Visibility, StateMutability } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod, IRStruct } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";
import { getUserEntrypointTemplate } from "@/templates/entrypoint.js";

import { convertType } from "./build-abi.js";
import { generateStructToABI } from "./entrypoint/struct-to-abi.js";
import { SymbolTableStack } from "../analyzers/shared/symbol-table.js";
import { generateArgsLoadBlock } from "../transformers/utils/args.js";

// Constants
const MEMORY_OFFSETS = {
  STRING_LENGTH_OFFSET: 0x20 + 28,
  STRING_DATA_OFFSET: 0x40,
  PADDING_MASK: 31,
} as const;

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
  functions?: string[];
  entries: string[];
  constructorSelector?: string;
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

function generateBytesReturnLogic(methodName: string, callArgs: Array<{ name: string }>): string {
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  return [
    `const rawPtr = ${methodName}(${argsList});`,
    `const len = 32;`,
    `const padded = ((len + ${MEMORY_OFFSETS.PADDING_MASK}) & ~${MEMORY_OFFSETS.PADDING_MASK});`,
    `const resultPtr = malloc(${MEMORY_OFFSETS.STRING_DATA_OFFSET} + padded);`,
    `store<u8>(resultPtr + 31, 0x20);`,
    `store<u32>(resultPtr + 32 + 28, len);`,
    `memory.copy(resultPtr + ${MEMORY_OFFSETS.STRING_DATA_OFFSET}, rawPtr, len);`,
    `write_result(resultPtr, ${MEMORY_OFFSETS.STRING_DATA_OFFSET} + padded);`,
    `return 0;`,
  ].join(`\n${INDENTATION.BODY}`);
}

function generateArrayReturnLogic(
  methodName: string,
  callArgs: Array<{ name: string }>,
  method: IRMethod,
): string {
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  const hasStorageReturn = method?.ir.some(
    (stmt) => stmt.kind === "return" && stmt.expr?.kind === "var" && stmt.expr?.scope === "storage",
  );

  const isDynamicStorageArray =
    method && method.outputs?.[0]?.type === "array_dynamic" && hasStorageReturn;

  if (isDynamicStorageArray) {
    return [
      `const buf = ${methodName}(${argsList});`,
      `const len = loadU32BE(buf + 32 + 28);`,
      `const totalSize = 64 + (len * 32);`,
      `write_result(buf, totalSize);`,
      `return 0;`,
    ].join(`\n${INDENTATION.BODY}`);
  }

  const isMemoryArrayMethod =
    methodName.includes("makeMemoryArray") ||
    methodName.includes("makeFixedMemoryArray") ||
    method?.ir.some(
      (stmt) =>
        stmt.kind === "return" && stmt.expr?.kind === "var" && stmt.expr?.scope === "memory",
    );
  if (isMemoryArrayMethod) {
    return [
      `const buf = ${methodName}(${argsList});`,
      `const len = loadU32BE(buf + 32 + 28);`,
      `const totalSize = 64 + (len * 32);`,
      `write_result(buf, totalSize);`,
      `return 0;`,
    ].join(`\n${INDENTATION.BODY}`);
  }

  return [
    `const buf = ${methodName}(${argsList});`,
    `const len = loadU32BE(buf + 28);`,
    `const totalSize = 64 + (len * 32);`,
    `write_result(buf, totalSize);`,
    `return 0;`,
  ].join(`\n${INDENTATION.BODY}`);
}

function generateStructReturnLogic(
  methodName: string,
  callArgs: Array<{ name: string }>,
  structInfo: IRStruct,
): string {
  let callLine = "";

  const argsList = callArgs.map((arg) => arg.name).join(", ");

  callLine = [
    `const ptr = ${methodName}(${argsList});`,
    `const resultPointer = ${structInfo.name}_toABI(ptr);`,
    `const size = ${structInfo.name}_getDynamicSize(ptr);`,
    `write_result(resultPointer, size);`,
    `return 0;`,
  ].join("\n    ");

  return callLine;
}

function generateReturnLogic(
  methodName: string,
  callArgs: Array<{ name: string }>,
  outputType: AbiType | string,
  contract: IRContract,
  method?: IRMethod,
): string {
  const argsList = callArgs.map((arg) => arg.name).join(", ");

  if (outputType === AbiType.String) {
    return generateStringReturnLogic(methodName, callArgs);
  }

  if (outputType === AbiType.Bytes) {
    return generateBytesReturnLogic(methodName, callArgs);
  }

  const isArrayType =
    (typeof outputType === "string" && outputType.endsWith("[]")) || outputType === "array_dynamic";
  if (isArrayType) {
    return generateArrayReturnLogic(methodName, callArgs, method!);
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

  return generateReturnLogic(name, callArgs, outputType, contract, method);
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

/**
 * Generates constructor entry for first-time deployment
 * Uses normalized 'contract_constructor' name for consistent selector generation
 */
function generateConstructorEntry(
  contractName: string,
  constructor: { inputs: AbiInput[] },
  contractPath: string,
  symbolTable: SymbolTableStack,
): { imports: string[]; entry: string; selector: string } {
  const { inputs } = constructor;

  const { argLines, callArgs } = generateArgsLoadBlock(inputs);

  const deployMethod: IRMethod = {
    name: `contract_constructor`,
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

  return { imports, entry, selector: deploySig };
}

function processContractMethods(contract: IRContract): CodeBlock {
  const imports: string[] = [];
  const functions: string[] = [];
  const entries: string[] = [];

  contract.structs?.forEach((struct) => {
    const structFunctions = generateStructToABI(struct);
    functions.push(structFunctions);
  });

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

  return { imports, functions, entries };
}

/**
 * Processes fallback and receive functions for entrypoint dispatch logic
 * Supports all combinations: fallback only, receive only, both, or neither
 * Order independent - can handle receive defined before fallback or vice versa
 */
function processFallbackAndReceive(contract: IRContract): {
  imports: string[];
  fallbackEntry?: string;
  receiveEntry?: string;
} {
  const imports: string[] = [];
  let fallbackEntry: string | undefined;
  let receiveEntry: string | undefined;

  if (contract.fallback) {
    const method = contract.fallback;
    try {
      const importStatement = `import { ${method.name} } from "./${contract.path}.transformed";`;
      imports.push(importStatement);

      const { argLines, callArgs } = generateArgsLoadBlock(method.inputs);
      const callLogic = generateMethodCallLogic(method, callArgs, contract);
      const bodyLines = [...argLines, callLogic]
        .map((line) => `${INDENTATION.BODY}${line}`)
        .join("\n");

      fallbackEntry = `${INDENTATION.BLOCK}// Fallback function call\n${bodyLines}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error processing fallback method: ${message}`);
    }
  }

  if (contract.receive) {
    const method = contract.receive;
    try {
      const importStatement = `import { ${method.name} } from "./${contract.path}.transformed";`;
      imports.push(importStatement);

      const { argLines, callArgs } = generateArgsLoadBlock(method.inputs);
      const callLogic = generateMethodCallLogic(method, callArgs, contract);
      const bodyLines = [...argLines, callLogic]
        .map((line) => `${INDENTATION.BODY}${line}`)
        .join("\n");

      receiveEntry = `${INDENTATION.BLOCK}// Receive function call\n${bodyLines}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error processing receive method: ${message}`);
    }
  }

  return { imports, fallbackEntry, receiveEntry };
}

function processConstructor(contract: IRContract): CodeBlock {
  if (!contract.constructor) {
    return { imports: [], entries: [] };
  }

  try {
    const { imports, entry, selector } = generateConstructorEntry(
      contract.name,
      contract.constructor,
      contract.path,
      contract.symbolTable,
    );
    return { imports, entries: [entry], constructorSelector: selector };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error processing constructor: ${message}`);
  }
}

/**
 * Generates complete user entrypoint with fallback/receive support and constructor handling
 * Handles first-time deployment constructor execution and fallback/receive dispatch logic
 */
export function generateUserEntrypoint(contract: IRContract): EntrypointResult {
  try {
    validateContract(contract);

    const methodsResult = processContractMethods(contract);
    const constructorResult = processConstructor(contract);
    const fallbackReceiveResult = processFallbackAndReceive(contract);

    const allFunctions = methodsResult.functions ?? [];

    const allImports = [
      ...methodsResult.imports,
      ...constructorResult.imports,
      ...fallbackReceiveResult.imports,
      ...allFunctions,
    ];
    const allEntries = contract.constructor
      ? [...methodsResult.entries]
      : [...methodsResult.entries, ...constructorResult.entries];

    let entrypointBody = allEntries.join("\n");

    if (contract.fallback || contract.receive) {
      let fallbackDispatch = "";

      if (contract.receive && contract.fallback) {
        if (!fallbackReceiveResult.fallbackEntry || !fallbackReceiveResult.receiveEntry) {
          throw new Error(
            "Both fallback and receive functions are defined but entries are missing",
          );
        }

        fallbackDispatch = `
  if (!isFirstTimeDeploy()) {
    if (selector == 0 && Msg.hasValue()) {
${fallbackReceiveResult.receiveEntry.replace(/^ {2}/, "      ")}
    } else {
${fallbackReceiveResult.fallbackEntry.replace(/^ {2}/, "      ")}
    }
  }
  return 0;`;
      } else if (contract.receive) {
        if (!fallbackReceiveResult.receiveEntry) {
          throw new Error("Receive function is defined but entry is missing");
        }

        fallbackDispatch = `
  if (!isFirstTimeDeploy()) {
    if (selector == 0 && Msg.hasValue()) {
${fallbackReceiveResult.receiveEntry.replace(/^ {2}/, "      ")}
    }
  }
  return 0;`;
      } else if (contract.fallback) {
        if (!fallbackReceiveResult.fallbackEntry) {
          throw new Error("Fallback function is defined but entry is missing");
        }

        fallbackDispatch = `
  if (!isFirstTimeDeploy()) {
${fallbackReceiveResult.fallbackEntry.replace(/^ {2}/, "    ")}
  }
  return 0;`;
      }

      entrypointBody = entrypointBody + "\n" + fallbackDispatch;

      return {
        imports: allImports.join("\n"),
        entrypointBody,
      };
    }

    entrypointBody = entrypointBody + "\n  return 0;";

    return {
      imports: allImports.join("\n"),
      entrypointBody,
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
    indexTemplate = indexTemplate.replace("// @user_entrypoint\n  return 0;", entrypointBody);

    if (contract.constructor) {
      const constructorResult = processConstructor(contract);
      if (constructorResult.constructorSelector) {
        const constructorCall = constructorResult.entries[0];
        const constructorLines = constructorCall.split("\n");
        const bodyLines = constructorLines.slice(1, -1);
        const processedLines = bodyLines.map((line) => {
          return line.replace(/; return 0;/, ";");
        });
        const constructorBody = processedLines.join("\n");
        const constructorCheck = `if (selector == ${constructorResult.constructorSelector}) {
${constructorBody}
      store_initialized_storage(Boolean.create(true));
      return 0;`;
        const constructorFallthrough = `}`;
        indexTemplate = indexTemplate.replace("// @constructor_check", constructorCheck);
        indexTemplate = indexTemplate.replace(
          "// @constructor_fallthrough",
          constructorFallthrough,
        );
      } else {
        indexTemplate = indexTemplate.replace("// @constructor_check", "");
        indexTemplate = indexTemplate.replace(
          "// @constructor_fallthrough",
          "store_initialized_storage(Boolean.create(true));",
        );
      }
    } else {
      indexTemplate = indexTemplate.replace("// @constructor_check", "");
      indexTemplate = indexTemplate.replace(
        "// @constructor_fallthrough",
        "store_initialized_storage(Boolean.create(true));",
      );
    }

    const outputPath = path.join(contractBasePath, `${contract.path}.entrypoint.ts`);
    writeFile(outputPath, indexTemplate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build entrypoint for ${userFilePath}: ${message}`);
  }
}
