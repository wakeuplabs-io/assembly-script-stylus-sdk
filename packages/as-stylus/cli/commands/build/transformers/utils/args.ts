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
      case "boolean":
        loadExpr = `load<u8>(position + ${offset}) != 0`;
        offset += 1;
        break;

      case "U256":
      case "I256":
      case "Str":
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

export function generateArgsLoadBlockWithStringSupport(
  inputs: AbiInput[],
  baseOffset: number = 4
): { argLines: string[]; callArgs: string[] } {
  const argLines: string[] = [];
  const callArgs: string[] = [];
  let offset = baseOffset;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;

    switch (input.type) {
      case "string":
      case "Str":
        argLines.push(
          `const off${i} = loadU32BE(position + ${offset} + 28);`,
          `const len${i} = loadU32BE(position + 4 + off${i} + 28);`,
          `const strPtr${i}: usize = Str.fromBytes(position + 4 + off${i} + 32, len${i});`
        );
        callArgs.push(`strPtr${i}`);
        offset += 32;
        break;

      case "Address":
        argLines.push(`const ${argName} = position + ${offset} + 12;`);
        callArgs.push(argName);
        offset += 32;
        break;

      case "bool":
      case "boolean":
        argLines.push(`const ${argName} = load<u8>(position + ${offset} + 31);`);
        callArgs.push(argName);
        offset += 32;
        break;

      case "U256":
      case "I256":
        argLines.push(`const ${argName} = position + ${offset};`);
        callArgs.push(argName);
        offset += 32;
        break;

      default:
        argLines.push(`const ${argName} = position + ${offset};`);
        callArgs.push(argName);
        offset += 32;
    }
  }

  return { argLines, callArgs };
}
