import { CallExpression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

function extractGenericType(call: CallExpression): string | undefined {
  // The generic type arguments are on the CallExpression itself, not the expression
  const typeArgs = call.getTypeArguments();

  if (typeArgs.length > 0) {
    return typeArgs[0].getText();
  }

  return undefined;
}

export function buildArrayIR(
  target: string,
  call: CallExpression,
  args: IRExpression[],
  scope: "memory" | "storage",
): IRExpression {
  // Handle StaticArrayFactory methods specifically
  if (target.startsWith("StaticArrayFactory.")) {
    const [_, methodName] = target.split(".");
    const genericType = extractGenericType(call);
    return {
      kind: "call" as const,
      target: methodName,
      args,
      type: AbiType.Function,
      returnType: AbiType.ArrayStatic,
      scope,
      receiver: {
        kind: "var" as const,
        name: "StaticArrayFactory",
        type: AbiType.Function,
        scope: "memory" as const,
      },
      genericType,
    };
  }

  // Handle DynamicArrayFactory methods specifically
  if (target.startsWith("DynamicArrayFactory.")) {
    const [_, methodName] = target.split(".");
    const genericType = extractGenericType(call);
    return {
      kind: "call" as const,
      target: methodName,
      args,
      type: AbiType.Function,
      returnType: AbiType.ArrayDynamic,
      scope,
      receiver: {
        kind: "var" as const,
        name: "DynamicArrayFactory",
        type: AbiType.Function,
        scope: "memory" as const,
      },
      genericType,
    };
  }

  // Handle MemoryArrayFactory methods specifically
  if (target.startsWith("MemoryArrayFactory.")) {
    const [_, methodName] = target.split(".");
    const genericType = extractGenericType(call);
    return {
      kind: "call" as const,
      target: methodName,
      args,
      type: AbiType.Function,
      returnType: AbiType.ArrayDynamic,
      scope,
      receiver: {
        kind: "var" as const,
        name: "MemoryArrayFactory",
        type: AbiType.Function,
        scope: "memory" as const,
      },
      genericType,
    };
  }
  throw new Error(`Unrecognized array factory method: ${target}`);
}
