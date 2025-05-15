import { IRContract } from "../../../../types/ir.types.js";
import { initExpressionContext } from "../utils/expressions.js";
import { emitStatements } from "../utils/statements.js";
import { IMPORT_BLOCK, slotConst, loadFn, storeFn } from "../utils/storage.js";


/**
 * Generates the AssemblyScript code for a contract from its IR representation
 * @param contract IR representation of the contract
 * @returns Generated AssemblyScript code
 */
export function emitContract(contract: IRContract): string {
  initExpressionContext(contract.name);
  
  const parts: string[] = [IMPORT_BLOCK];

  // Storage slots
  contract.storage.forEach((s) => {
    parts.push(slotConst(s.slot));
  });

  // Load/store helpers
  contract.storage.forEach((s) => {
    parts.push(loadFn(s.name, s.slot));
    parts.push(storeFn(s.name, s.slot));
  });

  // Constructor
  if (contract.constructor) {
    parts.push(
      `export function deploy(): void {\n${emitStatements(
        contract.constructor.ir
      )}\n}`
    );
  }

  // Methods
  contract.methods.forEach((m) => {
    let returnType = "void";
    
    if (m.stateMutability === "view" || m.stateMutability === "pure") {
      if (m.outputs && m.outputs.length > 0 && 
         (m.outputs[0].type === "U256" || m.outputs[0].type === "u64")) {
        returnType = "usize";
      }
    }
    
    parts.push(
      `export function ${m.name}(): ${returnType} {\n${emitStatements(
        m.ir
      )}\n}`
    );
  });

  return parts.join("\n\n");
}