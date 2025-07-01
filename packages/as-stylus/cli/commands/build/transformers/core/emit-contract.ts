import { AbiInput, AbiOutput, AbiType, AssemblyScriptType } from "@/cli/types/abi.types.js";

import { IRContract, IRMethod } from "../../../../types/ir.types.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { registerStructTransformer } from "../struct/struct-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { generateDeployFunction } from "../utils/deploy.js";
import { initExpressionContext } from "../utils/expressions.js";
import { emitStatements } from "../utils/statements.js";
import { generateStorageImports, generateStorageHelpers } from "../utils/storage.js";

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
    if (inp.type === AbiType.Bool) {
      return `  const ${inp.name} = Boolean.create(${callArgs[i].name});`;
    }
    return `  const ${inp.name} = ${callArgs[i].name};`;
  });
  
  if (inputs.some(inp => inp.type === AbiType.String)) {
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
  
  return "usize";
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
  parts.push(generateStorageImports(contract.storage, contract.structs && contract.structs.length > 0));

  // Add storage slots
  parts.push(...generateStorageHelpers(contract.storage, contract.structs || []));

  // Struct helpers
  parts.push(...registerStructTransformer(contract));

  // Add events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract)); 
  }

  // Add constructor
  if (contract.constructor) {
    parts.push(generateDeployFunction(contract));
    parts.push("");
  }

  // Add methods
  const methodParts = contract.methods.map(method => generateMethod(method));
  parts.push(...methodParts.map(method => method));

  return parts.join("\n");
 
}

