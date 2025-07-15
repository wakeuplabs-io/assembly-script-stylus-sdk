import { IRContract, IRMethod } from "../../../../types/ir.types.js";
import { registerErrorTransformer } from "../error/error-transformer.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { registerStructTransformer } from "../struct/struct-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { generateDeployFunction } from "../utils/deploy.js";
import { initExpressionContext } from "../utils/expressions.js";
import { emitStatements } from "../utils/statements.js";
import { generateImports, generateStorageHelpers } from "../utils/storage.js";

interface ArgumentSignature {
  argsSignature: string;
  aliasLines: string[];
}

/**
 * Generates the method signature and argument aliasing for a given method
 * @param method Method to generate signature for
 * @returns Object containing signature and alias lines
 */
function generateMethodSignature(method: IRMethod): ArgumentSignature {
  const { callArgs } = generateArgsLoadBlock(method.inputs);
  const argsSignature = callArgs.map(arg => `${arg.name}: ${arg.type}`).join(", ");
  const aliasLines = method.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i].name};`);
  
  if (method.inputs.some(inp => inp.type === "string")) {
    aliasLines.push(`  const argsStart: usize = arg0;`);
  }

  return {
    argsSignature,
    aliasLines,
  };
}

/**
 * Generates a single method's AssemblyScript code
 * @param method Method to generate code for
 * @returns Generated method code
 */
function generateMethod(method: IRMethod): string {
  let returnType = "void";
  if (method.outputs && method.outputs.length > 0 && method.outputs[0].type !== "void") {
    returnType = "usize";
  }

  const { argsSignature, aliasLines } = generateMethodSignature(method);
  const body = emitStatements(method.ir);

  const methodLines = [
    `export function ${method.name}(${argsSignature}): ${returnType} {`,
    ...aliasLines.map(line => line),
    body,
    "}"
  ];

  return methodLines.join("\n");
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
  parts.push(generateImports(contract));

  // Add storage slots
  parts.push(...generateStorageHelpers(contract.storage, contract.structs || []));

  // Struct helpers
  parts.push(...registerStructTransformer(contract));

  // Add events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract)); 
  }

  // Custom Errors
  parts.push(...registerErrorTransformer(contract));
  
  // Add constructor
  if (contract.constructor) {
    parts.push(generateDeployFunction(contract));
    parts.push("");
  }

  // Add methods
  const methodParts = contract.methods.map(method => generateMethod(method));

  parts.push(...methodParts);

  return parts.join("\n");
}

