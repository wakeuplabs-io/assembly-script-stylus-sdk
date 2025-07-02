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
    let type: AssemblyScriptType;

    switch (input.type) {
      case AbiType.Bool:
        argLines.push(`const ${argName} = Boolean.toValue(position + ${offset});`);
        offset += 32;
        type = AssemblyScriptType.Bool;
        break;

      case AbiType.Uint256:
        argLines.push(`const ${argName} = position + ${offset};`);
        type = AssemblyScriptType.Pointer;
        offset += 32;
        break;
        
        case AbiType.String:
        argLines.push(`const ${argName} = position + ${offset};`);
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;
        
        case AbiType.Address:
        argLines.push(`const ${argName} = position + ${offset};`);
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      default:
        throw new Error(`Unsupported input type: ${input.type}`);
    }

    callArgs.push({name: argName, type });
  }

  return { argLines, callArgs };
}

export function generateArgsEntryPoint(
  inputs: AbiInput[],
  baseOffset: number = 4
): { argLines: string[]; callArgs: {name: string, type: AssemblyScriptType}[] } {
  const argLines: string[] = [];
  const callArgs: {name: string, type: AssemblyScriptType}[] = [];
  let offset = baseOffset;

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const argName = `arg${i}`;
    let type: AssemblyScriptType;

    switch (input.type) {
      case AbiType.Bool:
        argLines.push(`const ${argName} = position + ${offset};`);
        offset += 32;
        type = AssemblyScriptType.Bool;
        break;

      case AbiType.Uint256:
        argLines.push(`const ${argName} = position + ${offset};`);
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      case AbiType.String:
        argLines.push(
          `const off${i} = loadU32BE(position + ${offset} + 28);`,
          `const len${i} = loadU32BE(position + 4 + off${i} + 28);`,
          `const ${argName}: usize = Str.fromBytes(position + 4 + off${i} + 32, len${i});`
        );

        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      case AbiType.Address:
        argLines.push(`const ${argName} = position + ${offset};`);
        offset += 32;
        type = AssemblyScriptType.Pointer;
        break;

      default:
        throw new Error(`Unsupported input type: ${input.type}`);
    }

    callArgs.push({name: argName, type });
  }

  return { argLines, callArgs };
}

