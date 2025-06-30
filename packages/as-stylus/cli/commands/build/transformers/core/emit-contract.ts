import { AbiInput, AbiOutput, AbiType, AssemblyScriptType } from "@/cli/types/abi.types.js";

import { IRConstructor, IRContract, IRMethod } from "../../../../types/ir.types.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { initExpressionContext } from "../utils/expressions.js";
import { emitStatements } from "../utils/statements.js";
import { generateStorageImports, generateStorageHelpers } from "../utils/storage.js";

// TODO: unify use of types
const POINTER_RETURN_TYPES: AbiType[] = [
  AbiType.Uint256,
  AbiType.String,
  AbiType.Address,
  AbiType.Bool,
  AbiType.Bytes32,
  AbiType.Void
];

interface ArgumentSignature {
  argsSignature: string;
  aliasLines: string[];
}

/**
 * Generates argument signature and alias lines for function parameters
 */
function generateArgumentSignature(
  inputs: AbiInput[], 
  callArgs: {name: string, type: AssemblyScriptType}[]
): ArgumentSignature {
  const argsSignature = callArgs.map(arg => `${arg.name}: ${arg.type}`).join(", ");
  const aliasLines = inputs.map((inp, i) => {
    if (inp.type === "bool") {
      return `  const ${inp.name} = allocBool(${callArgs[i].name});`;
    }
    return `  const ${inp.name} = ${callArgs[i].name};`;
  });
  
  if (inputs.some(inp => inp.type === "string")) {
    aliasLines.push(`  const argsStart: usize = arg0;`);
  }
  
  return { argsSignature, aliasLines };
}

/**
 * Determines the return type for a method based on its outputs
 */
function getMethodReturnType(outputs: AbiOutput[] | undefined): string {
  if (!outputs || outputs.length === 0) {
    return "void";
  }
  
  const firstOutputType = outputs[0].type;
  
  // Fix this
  return Object.values(POINTER_RETURN_TYPES).includes(firstOutputType) ? "usize" : "void";
}

/**
 * Generates the constructor function code
 */
function generateConstructor(constructor: IRConstructor): string {
  const { inputs } = constructor;
  const { callArgs } = generateArgsLoadBlock(inputs);
  const { argsSignature, aliasLines } = generateArgumentSignature(inputs, callArgs);
  const body = emitStatements(constructor.ir);
  const aliasBlock = aliasLines.length ? aliasLines.join("\n") + "\n" : "";

  return `\nexport function deploy(${argsSignature}): void {\n${aliasBlock}${body}}`;
}

/**
 * Generates a single method function code
 */
function generateMethod(method: IRMethod): string {
  const returnType = getMethodReturnType(method.outputs);
  const { callArgs } = generateArgsLoadBlock(method.inputs);
  const { argsSignature, aliasLines } = generateArgumentSignature(method.inputs, callArgs);
  const body = emitStatements(method.ir);

  const aliasBlock = aliasLines.length ? aliasLines.join("\n") + "\n" : "";

  return `\nexport function ${method.name}(${argsSignature}): ${returnType} {\n${aliasBlock}${body}\n}`;
}

/**
 * Generates the AssemblyScript code for a contract from its IR representation
 * @param contract IR representation of the contract
 * @returns Generated AssemblyScript code
 */
export function emitContract(contract: IRContract): string {
  initExpressionContext(contract.name);
  const parts: string[] = [];

  // Add imports
  parts.push(generateStorageImports(contract.storage));

  // Add storage slots
  parts.push(...generateStorageHelpers(contract.storage));

  // Add events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract.events));
  }

  // Add constructor
  if (contract.constructor) {
    parts.push(generateConstructor(contract.constructor));
    parts.push("");
  }

  // Add methods
  const methodParts = contract.methods.map(method => generateMethod(method));
  parts.push(...methodParts.map(method => method));

  return parts.join("\n");
}

