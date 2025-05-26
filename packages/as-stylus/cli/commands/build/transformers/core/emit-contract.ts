import { IRContract } from "../../../../types/ir.types.js";
import { generateArgsLoadBlock } from "../utils/args.js";
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
    const { inputs } = contract.constructor;
    const { callArgs } = generateArgsLoadBlock(inputs);
    const argsSignature = callArgs.map(a => `${a}: usize`).join(", ");
    const aliasLines = inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);
    const body = emitStatements(contract.constructor.ir);
  
    parts.push(
      `export function deploy(${argsSignature}): void {\n` +
      aliasLines.join("\n") + "\n" +
      body + "\n}"
    );
  }
  
  
  // Methods
  contract.methods.forEach((m) => {
    let returnType = "void";
  
    if ((m.stateMutability === "view" || m.stateMutability === "pure") &&
        m.outputs && m.outputs.length > 0 &&
        (m.outputs[0].type === "U256" || m.outputs[0].type === "u64")) {
      returnType = "usize";
    }
  
    const { callArgs } = generateArgsLoadBlock(m.inputs);
    const argsSignature = callArgs.map(arg => `${arg}: usize`).join(", ");
    const body = emitStatements(m.ir);
    const aliasLines = m.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);

    parts.push(
      `export function ${m.name}(${argsSignature}): ${returnType} {\n` +
      aliasLines.join("\n") + "\n" +
      body + "\n}"
    );
  });

  return parts.join("\n\n");
}