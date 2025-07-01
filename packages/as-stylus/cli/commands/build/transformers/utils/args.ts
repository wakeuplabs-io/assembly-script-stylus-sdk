import { AbiInput, AbiType, AssemblyScriptType } from "@/cli/types/abi.types.js";

export function generateArgsLoadBlock(
  inputs: AbiInput[],
  baseOffset: number = 4
): { argLines: string[]; callArgs: {name: string, type: AssemblyScriptType}[] } {
  const argLines: string[] = [];
  const callArgs: {name: string, type: AssemblyScriptType}[] = [];
  let offset = baseOffset;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;
    let loadExpr: string;
    let type: AssemblyScriptType;

    switch (input.type) {
      case AbiType.Bool:
        loadExpr = `Boolean.toValue(position + ${offset})`;
        offset += 32;
        type = AssemblyScriptType.Bool;
        break;

      case AbiType.Uint256:
      case AbiType.String:
        loadExpr = `position + ${offset}`;
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      case AbiType.Address:
        loadExpr = `position + ${offset}`;
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      default:
        throw new Error(`Unsupported input type: ${input.type}`);
    }

    argLines.push(`const ${argName} = ${loadExpr};`);
    callArgs.push({name: argName, type });
  }

  return { argLines, callArgs };
}

// TODO: not used. Check if it's needed.
export function generateArgsLoadBlockWithStringSupport(
  inputs: AbiInput[],
  baseOffset: number = 4
): { argLines: string[]; callArgs: {name: string, type: AssemblyScriptType}[] } {
  const argLines: string[] = [];
  const callArgs: {name: string, type: AssemblyScriptType}[] = [];
  let offset = baseOffset;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;

    switch (input.type) {
      case AbiType.String:
        argLines.push(
          `const off${i} = loadU32BE(position + ${offset} + 28);`,
          `const len${i} = loadU32BE(position + 4 + off${i} + 28);`,
          `const strPtr${i}: usize = Str.fromBytes(position + 4 + off${i} + 32, len${i});`
        );
        callArgs.push({name: `strPtr${i}`, type: AssemblyScriptType.Pointer});
        offset += 32;
        break;

      case AbiType.Address:
        argLines.push(`const ${argName} = position + ${offset};`);
        callArgs.push({name: argName, type: AssemblyScriptType.Pointer});
        offset += 32;
        break;

      case AbiType.Bool:
        argLines.push(`const ${argName} = Boolean.create(position + ${offset});`);
        callArgs.push({name: argName, type: AssemblyScriptType.Bool});
        offset += 32;
        break;

      case AbiType.Uint256:
      case AbiType.Int256:
        argLines.push(`const ${argName} = position + ${offset};`);
        callArgs.push({name: argName, type: AssemblyScriptType.Pointer});
        offset += 32;
        break;

      default:
        argLines.push(`const ${argName} = position + ${offset};`);
        callArgs.push({name: argName, type: AssemblyScriptType.Pointer});
        offset += 32;
    }
  }

  return { argLines, callArgs };
}
