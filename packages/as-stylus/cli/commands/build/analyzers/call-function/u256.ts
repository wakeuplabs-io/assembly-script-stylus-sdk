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
  // Parse target once at the beginning - handle multiple dots correctly
  const parts = target.split(".");
  const receiverName = parts.slice(0, -1).join(".");
  const operation = parts.slice(-1)[0];

  const args = call.getArguments().map((arg) => {
    const builder = new ExpressionIRBuilder(arg as Expression);
    return builder.validateAndBuildIR();
  });

  const targetSymbol = symbolTable.lookup(receiverName);
  const scope = targetSymbol?.scope ?? "memory";

  if (operation in operationConvertor) {
    return {
      kind: "condition",
      left: {
        kind: "var",
        name: receiverName,
        type: AbiType.Uint256,
        scope,
        isConstant: false,
      },
      right: args[0],
      op: operationConvertor[operation as U256ComparisonOperation],
      type: AbiType.Bool,
    } satisfies IRCondition;
  }

  // Handle U256Factory operations
  if (receiverName === "U256Factory") {
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
        isConstant: false,
      },
    };
  }

  // Handle regular U256 operations (like variable.add)
  return {
    kind: "call",
    target: operation,
    args,
    type: AbiType.Function,
    returnType: AbiType.Uint256,
    scope,
    receiver: {
      kind: "var" as const,
      name: receiverName,
      type: AbiType.Uint256,
      scope: scope as "memory" | "storage",
      isConstant: false,
    },
  };
}
