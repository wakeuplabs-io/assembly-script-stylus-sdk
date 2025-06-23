import { IRContract } from "../../../../types/ir.types.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { generateStructHelpers } from "../struct/struct-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { initExpressionContext } from "../utils/expressions.js";
import { emitStatements } from "../utils/statements.js";
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
  parts.push(generateStorageImports(contract.storage));

  // Storage slots
  parts.push(...generateStorageHelpers(contract.storage));

  // Struct helpers
  if (contract.structs && contract.structs.length > 0) {
    contract.structs.forEach(struct => {
      parts.push(...generateStructHelpers(struct));
    });
  }

  // Events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract.events)); 
  }

  // Constructor
  if (contract.constructor) {
    const { inputs } = contract.constructor;
    const { callArgs } = generateArgsLoadBlock(inputs);
    const argsSignature = callArgs.map(a => `${a}: usize`).join(", ");
    const aliasLines = inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);
    if (inputs.some(inp => inp.type === "string")) {
      aliasLines.push(`  const argsStart: usize = arg0;`);
    }
    const body = emitStatements(contract.constructor.ir);
  
    parts.push(
      `export function deploy(${argsSignature}): void {\n` +
      aliasLines.join("\n") + "\n" +
      body + "\n}"
    );
    parts.push("");
  }
  
  
  // Methods
  contract.methods.forEach((m) => {
    let returnType = "void";
  
    if (m.outputs && m.outputs.length > 0 &&
        (["U256", "u64", "string", "Address", "boolean", "Str"].includes(m.outputs[0].type))) {
      returnType = "usize";
    }
  
    const { callArgs } = generateArgsLoadBlock(m.inputs);
    const argsSignature = callArgs.map(arg => `${arg}: usize`).join(", ");
    
    const body = emitStatements(m.ir);
    const aliasLines = m.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);
    if (m.inputs.some(inp => inp.type === "string")) {
      aliasLines.push(`  const argsStart: usize = arg0;`);
    }

    parts.push(
      `export function ${m.name}(${argsSignature}): ${returnType} {\n` +
      aliasLines.join("\n") + "\n" +
      body + "\n}"
    );
    parts.push(""); 
  });

  return parts.join("\n");
}

