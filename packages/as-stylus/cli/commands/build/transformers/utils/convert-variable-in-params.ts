import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

/**
 * Converts a variable in params to an IRExpression
 * @param target - The target string
 * @param type - The type of the variable
 * @returns The IRExpression
 */
export function convertVariableInParams(target: string, type: AbiType): IRExpression {
  if (target.indexOf(".") === -1) {
    return { kind: "var" as const, name: target, type, scope: "memory" };
  }
  const [head, ...rest] = target.split(".");
  let node: IRExpression = { kind: "var" as const, name: head, type, scope: "memory" };
  for (const prop of rest) {
    node = { kind: "member" as const, object: node, property: prop, type };
  }
  return node;
}