import { IRContract } from "../../../../types/ir.types.js";
import { registerErrorTransformer } from "../error/error-transformer.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { registerStructTransformer } from "../struct/struct-transformer.js";
import { generateDeployFunction } from "../utils/deploy.js";
import { initExpressionContext } from "../utils/expressions.js";
import { generateMethods } from "../utils/methods.js";
import { generateStorageImports, generateStorageHelpers } from "../utils/storage.js";
/**
 * Generates the AssemblyScript code for a contract from its IR representation
 * @param contract IR representation of the contract
 * @returns Generated AssemblyScript code
 */
export function emitContract(contract: IRContract): string {
  initExpressionContext(contract.name);
  const parts: string[] = [];

  // Imports
  parts.push(generateStorageImports(contract.storage, contract.structs && contract.structs.length > 0));

  // Storage slots
  parts.push(...generateStorageHelpers(contract.storage, contract.structs || []));

  // Struct helpers
  parts.push(...registerStructTransformer(contract));

  // Events
  parts.push(...registerEventTransformer(contract)); 

  // Custom Errors
  parts.push(...registerErrorTransformer(contract));

  // Constructor
  parts.push(generateDeployFunction(contract));
  parts.push("");
  
  // Methods
  parts.push(...generateMethods(contract));

  return parts.join("\n");
 
}

