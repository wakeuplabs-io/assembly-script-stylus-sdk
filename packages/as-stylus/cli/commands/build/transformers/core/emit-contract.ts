import { IRContract } from "../../../../types/ir.types.js";
import { registerEventTransformer } from "../event/event-transformer.js";
import { generateStructHelpers } from "../struct/struct-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { generateDeployFunction } from "../utils/deploy.js";
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
  parts.push(generateStorageImports(contract.storage, contract.structs && contract.structs.length > 0));

  // Storage slots
  parts.push(...generateStorageHelpers(contract.storage, contract.structs || []));

  // Struct helpers
  if (contract.structs && contract.structs.length > 0) {
    contract.structs.forEach(struct => {
      const structVariable = contract.storage.find(v => 
        v.type === struct.name && v.kind === "simple"
      );
      
      if (structVariable) {
        const baseSlot = structVariable.slot;
        
        const existingSlots = new Set(contract.storage.map(v => v.slot));
        const numSlots = Math.ceil(struct.size / 32);
        
        for (let i = 0; i < numSlots; i++) {
          const slotValue = baseSlot + i;
          if (!existingSlots.has(slotValue)) {
            const slotNumber = slotValue.toString(16).padStart(2, "0");
            parts.push(`const __SLOT${slotNumber}: u64 = ${slotValue};`);
          }
        }
        if (numSlots > 1) {
          parts.push(''); // Add empty line after slot constants only if we added some
        }
        
        parts.push(...generateStructHelpers(struct, baseSlot));
      } else {
        // Fallback si no se encuentra la variable de storage
        parts.push(...generateStructHelpers(struct, 0));
      }
    });
  }

  // Events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract.events)); 
  }

  // Constructor
  parts.push(generateDeployFunction(contract));
  parts.push("");
  
  
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

