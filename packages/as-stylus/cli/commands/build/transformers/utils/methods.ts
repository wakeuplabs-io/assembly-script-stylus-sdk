import { generateArgsLoadBlock } from "./args.js";
import { emitStatements } from "./statements.js";
import { IRContract } from "../../../../types/ir.types.js";

/**
 * Generates AssemblyScript methods from IR method representations
 * @param methods Array of IR methods to generate
 * @returns Array of generated method strings
 */
export function generateMethods(contract: IRContract): string[] {
  const methodParts: string[] = [];

  contract.methods.forEach((m) => {
    let returnType = "void";
    if (m.outputs && m.outputs.length > 0 && m.outputs[0].type !== "void") {
      returnType = "usize";
    }

    const { callArgs } = generateArgsLoadBlock(m.inputs);
    const argsSignature = callArgs.map(arg => `${arg.name}: ${arg.type}`).join(", ");
    
    const body = emitStatements(m.ir);
    const aliasLines = m.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);
    
    if (m.inputs.some(inp => inp.type === "string")) {
      aliasLines.push(`  const argsStart: usize = arg0;`);
    }

    methodParts.push(
      `export function ${m.name}(${argsSignature}): ${returnType} {\n` +
      aliasLines.join("\n") + "\n" +
      body + "\n}"
    );
    methodParts.push(""); 
  });

  return methodParts;
} 