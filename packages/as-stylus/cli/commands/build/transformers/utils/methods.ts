import { generateArgsLoadBlock } from "./args.js";
import { IRContract } from "../../../../types/ir.types.js";
import { ContractContext } from "../core/contract-context.js";

/**
 * Generates AssemblyScript methods from IR method representations
 * @param methods Array of IR methods to generate
 * @returns Array of generated method strings
 */
export function generateMethods(contract: IRContract, contractContext: ContractContext): string[] {
  const methodParts: string[] = [];

  contract.methods.forEach((m) => {
    let returnType = "void";
    if (m.outputs && m.outputs.length > 0 && m.outputs[0].type !== "void") {
      returnType = "usize";
    }

    const { callArgs } = generateArgsLoadBlock(m.inputs);
    const argsSignature = callArgs.map((arg) => `${arg.name}: ${arg.type}`).join(", ");

    const body = contractContext.emitStatements(m.ir);
    const aliasLines = m.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);

    methodParts.push(
      `export function ${m.name}(${argsSignature}): ${returnType} {\n` +
        aliasLines.join("\n") +
        "\n" +
        body +
        "\n}",
    );
    methodParts.push("");
  });

  return methodParts;
}
