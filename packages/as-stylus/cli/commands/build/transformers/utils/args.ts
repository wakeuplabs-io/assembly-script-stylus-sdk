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
        loadExpr = `toBool(position + ${offset})`;
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
