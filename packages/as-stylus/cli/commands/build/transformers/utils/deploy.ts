import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { generateArgsLoadBlock } from "./args.js";
import { ContractContext } from "../core/contract-context.js";

export function generateDeployFunction(contract: IRContract, contractContext: ContractContext): string {
  const lines: string[] = [];
  
  if (contract.constructor) {
    const { inputs } = contract.constructor;
    const { callArgs } = generateArgsLoadBlock(inputs);
    const argsSignature = callArgs.map(a => `${a.name}: ${a.type}`).join(", ");
    const aliasLines = inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i].name};`);
    
    
    lines.push(`export function ${contract.name}_constructor(${argsSignature}): void {`);
    lines.push(...aliasLines);
  } else {
    lines.push(`export function ${contract.name}_constructor(): void {`);
  }

  contract.storage.forEach(variable => {
    const defaultValue = getDefaultValueForType(variable.type);
    switch (variable.kind) {
      case "simple":
        if (variable.type === AbiType.String) {
          lines.push(`  const empty${variable.name} = Str.create();`);
          lines.push(`  store_${variable.name}(empty${variable.name});`);
        } else {
          const symbol = contract.symbolTable.lookup(variable.name);
          lines.push(`  const default${variable.name} = ${getInitializer(variable.type as AbiType, defaultValue, symbol?.dynamicType)};`);
          lines.push(`  store_${variable.name}(default${variable.name});`);
        }
        break;
    }
  });

  if (contract.constructor) {
    const constructorBody = contractContext.emitStatements(contract.constructor.ir);
    if (constructorBody.trim()) {
      lines.push(constructorBody);
    }
  }

  lines.push(`}`);
  return lines.join("\n");
}

function getDefaultValueForType(type: AbiType | string): string {
  switch (type) {
    case AbiType.Uint256:
      return "0";
    case AbiType.Address:
      return "0x0000000000000000000000000000000000000000";
    case AbiType.Bool:
      return "false";
    case AbiType.String:
      return '""';
    case AbiType.Struct:
      return "null_struct";
    default:
      if (typeof type === "string" && (type.endsWith("Test") || type.includes("Struct"))) {
        return "null_struct";
      }
      return "0";
  }
}

function getInitializer(type: AbiType, defaultValue: string, dynamicType?: string): string {
  switch (type) {
    case AbiType.Uint256:
      return `U256.create()`;
    case AbiType.Address:
      return `Address.create()`;
    case AbiType.Bool:
      return `Boolean.create(${defaultValue})`;
    case AbiType.String:
      return `Str.create()`;
    case AbiType.Struct:
      return `${dynamicType}_alloc()`;
    default:
      return defaultValue;
  }
}