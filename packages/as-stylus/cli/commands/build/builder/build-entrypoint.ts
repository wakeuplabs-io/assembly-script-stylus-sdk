import path from "path";
import { AbiStateMutability, toFunctionSelector, toFunctionSignature } from "viem";

import { AbiType, AbiInput } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod, IRStruct } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";
import { getUserEntrypointTemplate } from "@/templates/entrypoint.js";

import { convertType } from "./build-abi.js";
import {
  generateArgsLoadBlock,
} from "../transformers/utils/args.js";

// Constants
const MEMORY_OFFSETS = {
  STRING_LENGTH_OFFSET: 0x20 + 28,
  STRING_DATA_OFFSET: 0x40,
  PADDING_MASK: 31,
} as const;

const VISIBILITY_TYPES = {
  PUBLIC_EXTERNAL: ['public', 'external', 'nonpayable'] as const,
  READ_ONLY: ['pure', 'view'] as const,
} as const;

const INDENTATION = {
  BODY: '    ',
  BLOCK: '  ',
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
    throw new Error('Method name is required');
  }
  if (!method.visibility) {
    throw new Error(`Method ${method.name} must have visibility`);
  }
}

function validateContract(contract: IRContract): void {
  if (!contract.methods) {
    throw new Error('Contract must have methods array');
  }
  
  contract.methods.forEach(validateMethod);
}

function getFunctionSelector(method: IRMethod): string {
  const { name, inputs, outputs = [] } = method;

  const signature = toFunctionSignature({
    name,
    type: "function",
    stateMutability: method.stateMutability as AbiStateMutability,
    inputs: inputs.map((input) => ({
      name: input.name,
      type: convertType(input.type),
    })),
    outputs: outputs.map(output => ({
      name: output.name,
      type: convertType(output.type),
    })),
  });

  return toFunctionSelector(signature);
}

function generateStringReturnLogic(methodName: string, callArgs: Array<{ name: string }>): string {
  const argsList = callArgs.map(arg => arg.name).join(", ");
  
  return [
    `const buf = ${methodName}(${argsList});`,
    `const len = loadU32BE(buf + ${MEMORY_OFFSETS.STRING_LENGTH_OFFSET});`,
    `const padded = ((len + ${MEMORY_OFFSETS.PADDING_MASK}) & ~${MEMORY_OFFSETS.PADDING_MASK});`,
    `write_result(buf, ${MEMORY_OFFSETS.STRING_DATA_OFFSET} + padded);`,
    `return 0;`
  ].join(`\n${INDENTATION.BODY}`);
}

function generateStructReturnLogic(methodName: string, callArgs: Array<{ name: string }>, structInfo: IRStruct): string {
    const { name, dynamic, size } = structInfo;
    let callLine = "";
      // For structs, we need to handle dynamic sizing
      if (dynamic) {
        // Dynamic struct: calculate size based on string content at offset 160
        callLine = [
          `let ptr = ${name}(${callArgs.join(", ")});`,
          `const stringLen = loadU32BE(ptr + 160 + 28);`,
          `const paddedLen = (stringLen + 31) & ~31;`,
          `const totalSize = 160 + 32 + paddedLen;`,
          `write_result(ptr, totalSize);`,
          `return 0;`,
        ].join("\n    ");
      } else {
        // Static struct: use fixed size
        callLine = `let ptr = ${name}(${callArgs.join(", ")}); write_result(ptr, ${size}); return 0;`;
      }
    
      return callLine;
}

function generateReturnLogic(methodName: string, callArgs: Array<{ name: string }>, outputType: AbiType, contract: IRContract): string {
  const argsList = callArgs.map(arg => arg.name).join(", ");
  
  if (outputType === AbiType.String) {
    return generateStringReturnLogic(methodName, callArgs);
  }

  const structName = extractStructName(outputType);
  const structInfo = contract.structs?.find(s => s.name === structName);
  
  // if (outputType === AbiType.Struct) {
  if (structInfo) {
    return generateStructReturnLogic(methodName, callArgs, structInfo);
  }
  
  const size = getReturnSize(outputType);
  return `let ptr = ${methodName}(${argsList}); write_result(ptr, ${size}); return 0;`;
}

function generateMethodCallLogic(method: IRMethod, callArgs: Array<{ name: string }>, contract: IRContract): string {
  const { name } = method;
  const outputType = method.outputs?.[0]?.type;
  const argsList = callArgs.map(arg => arg.name).join(", ");

  if (!outputType || outputType === AbiType.Void || outputType === AbiType.Any) {
    return `${name}(${argsList}); return 0;`;
  }

  return generateReturnLogic(name, callArgs, outputType, contract);
}

function generateMethodEntry(method: IRMethod, contract: IRContract): { import: string; entry: string } {
  validateMethod(method);
  
  const { name, visibility } = method;
  
  if (!VISIBILITY_TYPES.PUBLIC_EXTERNAL.includes(visibility as any)) {
    throw new Error(`Method ${name} has invalid visibility: ${visibility}`);
  }

  const selector = getFunctionSelector(method);
  const importStatement = `import { ${name} } from "./contract.transformed";`;
  
  const { argLines, callArgs } = generateArgsLoadBlock(method.inputs);
  const callLogic = generateMethodCallLogic(method, callArgs, contract);
  
  const bodyLines = [...argLines, callLogic]
    .map(line => `${INDENTATION.BODY}${line}`)
    .join('\n');
  
  const entry = `${INDENTATION.BLOCK}if (selector == ${selector}) {\n${bodyLines}\n${INDENTATION.BLOCK}}`;

  return { import: importStatement, entry };
}

function generateConstructorEntry(constructor: { inputs: AbiInput[] }): { imports: string[]; entry: string } {
  const { inputs } = constructor;
  const { argLines, callArgs } = generateArgsLoadBlock(inputs);

  
  const deployMethod: IRMethod = {
    name: "deploy",
    visibility: "public",
    stateMutability: "nonpayable",
    inputs: inputs.map(input => ({
      name: input.name,
      type: convertType(input.type),
    })),
    outputs: [],
    ir: [],
  };
  
  const deploySig = getFunctionSelector(deployMethod);
  const imports = [
    `import { deploy } from "./contract.transformed";`,
  ];

  const callLine = `deploy(${callArgs.map(arg => arg.name).join(", ")}); return 0;`;
  const bodyLines = [...argLines, callLine]
    .map(line => `${INDENTATION.BODY}${line}`)
    .filter(line => line.trim() !== "")
    .join('\n');

  const entry = `${INDENTATION.BLOCK}if (selector == ${deploySig}) {\n${bodyLines}\n${INDENTATION.BLOCK}}`;

  return { imports, entry };
}

function processContractMethods(contract: IRContract): CodeBlock {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const method of contract.methods) {
    if (VISIBILITY_TYPES.PUBLIC_EXTERNAL.includes(method.visibility as any)) {
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
    const { imports, entry } = generateConstructorEntry(contract.constructor);
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
      imports: allImports.join('\n'),
      entrypointBody: allEntries.join('\n'),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate user entrypoint: ${message}`);
  }
}

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  if (!userFilePath) {
    throw new Error('User file path is required');
  }

  try {
    const { imports, entrypointBody } = generateUserEntrypoint(contract);
    const contractBasePath = path.dirname(userFilePath);

    let indexTemplate = getUserEntrypointTemplate();
    indexTemplate = indexTemplate.replace("// @logic_imports", imports);
    indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

    const outputPath = path.join(contractBasePath, "entrypoint.ts");
    writeFile(outputPath, indexTemplate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build entrypoint for ${userFilePath}: ${message}`);
  }
}
