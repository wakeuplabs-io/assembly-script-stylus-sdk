import { AbiInput } from "@/cli/types/abi.types.js";

export function generateArgsLoadBlock(
  inputs: AbiInput[],
  baseOffset: number = 4
): { argLines: string[]; callArgs: string[] } {
  const argLines: string[] = [];
  const callArgs: string[] = [];
  let offset = baseOffset;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;
    let loadExpr: string;

    switch (input.type) {
      case "bool":
        loadExpr = `load<u8>(position + ${offset}) != 0`;
        offset += 1;
        break;

      case "U256":
      case "I256":
      case "string":
        loadExpr = `position + ${offset}`;
        offset += 32;
        break;

      case "Address":
        loadExpr = `position + ${offset}`;
        offset += 20;
        break;

      default:
        throw new Error(`Unsupported input type: ${input.type}`);
    }

    argLines.push(`const ${argName} = ${loadExpr};`);
    callArgs.push(argName);
  }

  return { argLines, callArgs };
}
