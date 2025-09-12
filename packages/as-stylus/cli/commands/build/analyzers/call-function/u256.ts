import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { ComparisonOperator, IRCondition, IRExpression } from "@/cli/types/ir.types.js";
import { U256 } from "@/cli/types/u256.interface.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

type U256ComparisonOperation = keyof Omit<U256, "toString" | "add" | "sub">;
const operationConvertor: Record<U256ComparisonOperation, ComparisonOperator> = {
  lessThan: "<",
  greaterThan: ">",
  lessThanOrEqual: "<=",
  greaterThanOrEqual: ">=",
  equals: "==",
  notEqual: "!=",
};

export function buildU256IR(
  target: string,
  call: CallExpression,
  symbolTable: SymbolTableStack,
): IRExpression {
  const [varName, operation] = target.split(".");
  const args = call.getArguments().map((arg) => {
    const builder = new ExpressionIRBuilder(arg as Expression);
    return builder.validateAndBuildIR();
  });

  const targetSymbol = symbolTable.lookup(varName);
  const scope = targetSymbol?.scope ?? "memory";

  const isComparisonOperation = Object.keys(operationConvertor).includes(operation);

  if (isComparisonOperation) {
    return {
      kind: "condition",
      left: { kind: "var", name: varName, type: AbiType.Uint256, scope },
      right: args[0],
      op: operationConvertor[operation as U256ComparisonOperation] as ComparisonOperator,
      type: AbiType.Bool,
    } satisfies IRCondition;
  }

  if (varName === "U256Factory") {
    return {
      kind: "call" as const,
      target: operation,
      args,
      type: AbiType.Function,
      returnType: AbiType.Uint256,
      scope,
      receiver: {
        kind: "var" as const,
        name: "U256Factory",
        type: AbiType.Function,
        scope: "memory" as const,
      },
    };
  }

  // For all other U256 operations (like variable.add), parse receiver and method separately
  const parts = target.split(".");
  if (parts.length === 2) {
    const receiverName = parts[0];
    const methodName = parts[1];

    return {
      kind: "call",
      target: methodName, // Just the method name
      args,
      type: AbiType.Function,
      returnType: AbiType.Uint256,
      scope,
      receiver: {
        kind: "var" as const,
        name: receiverName,
        type: AbiType.Uint256,
        scope: scope as "memory" | "storage",
      },
    };
  }

  // Fallback for patterns we don't understand
  return {
    kind: "call",
    target: target,
    args,
    type: AbiType.Function,
    returnType: AbiType.Uint256,
    scope,
  };
}