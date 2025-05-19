import { AbiInput } from "../../../../types/abi.types";

export function generateArgsLoadBlock(inputs: AbiInput[]): { argLines: string[], callArgs: string[] } {
  const argLines: string[] = [];
  const callArgs: string[] = [];
  let offset = 0;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;
    let loadExpr = "";

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
      case "address":
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
