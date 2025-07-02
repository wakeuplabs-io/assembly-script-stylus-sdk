import { IRContract } from "@/cli/types/ir.types.js";

import { generateArgsLoadBlock } from "./args.js";
import { emitStatements } from "./statements.js";

export function generateDeployFunction(contract: IRContract): string {
  const lines: string[] = [];
  
  if (contract.constructor) {
    const { inputs } = contract.constructor;
    const { callArgs } = generateArgsLoadBlock(inputs);
    const argsSignature = callArgs.map(a => `${a}: usize`).join(", ");
    const aliasLines = inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i]};`);
    
    if (inputs.some(inp => inp.type === "string")) {
      aliasLines.push(`  const argsStart: usize = arg0;`);
    }
    
    lines.push(`export function deploy(${argsSignature}): void {`);
    lines.push(...aliasLines);
  } else {
    lines.push(`export function deploy(): void {`);
  }

  contract.storage.forEach(variable => {
    const defaultValue = getDefaultValueForType(variable.type);
    switch (variable.kind) {
      case "simple":
        if (variable.type === "string" || variable.type === "Str") {
          lines.push(`  const empty${variable.name} = Str.create();`);
          lines.push(`  store_${variable.name}(empty${variable.name});`);
        } else {
          lines.push(`  const default${variable.name} = ${getInitializer(variable.type, defaultValue)};`);
          lines.push(`  store_${variable.name}(default${variable.name});`);
        }
        break;
    }
  });

  if (contract.constructor) {
    const constructorBody = emitStatements(contract.constructor.ir);
    lines.push(constructorBody);
  }

  lines.push(`}`);
  return lines.join("\n");
}

function getDefaultValueForType(type: string): string {
  switch (type) {
    case "U256":
      return "0";
    case "Address":
      return "0x0000000000000000000000000000000000000000";
    case "boolean":
      return "false";
    case "Str":
    case "string":
      return '""';
    default:
      if (type.endsWith("Test") || type.includes("Struct")) {
        return "null_struct";
      }
      return "0";
  }
}

function getInitializer(type: string, defaultValue: string): string {
  switch (type) {
    case "U256":
      return `U256.create()`;
    case "Address":
      return `Address.create()`;
    case "boolean":
      return `Boolean.create(${defaultValue})`;
    case "Str":
      return `Str.create()`;
    default:
      if (type.endsWith("Test") || type.includes("Struct")) {
        return `${type}_alloc()`;
      }
      return defaultValue;
  }
}