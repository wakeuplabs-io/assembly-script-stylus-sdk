import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { I256 } from "@/cli/types/i256.interface.js";
import { ComparisonOperator, IRCondition, IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

type I256ComparisonOperation = keyof Omit<I256, "toString" | "add" | "sub" | "negate" | "abs" | "isNegative">;
const operationConvertor: Record<I256ComparisonOperation, ComparisonOperator> = {
  lessThan: "<",
  greaterThan: ">",
  lessThanOrEqual: "<=",
  greaterThanOrEqual: ">=",
  equal: "==",
  notEqual: "!=",
};

export function buildI256IR(target: string, call: CallExpression, symbolTable: SymbolTableStack): IRExpression {
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
      left: { kind: "var", name: varName, type: AbiType.Int256, scope },
      right: args[0],
      op: operationConvertor[operation as I256ComparisonOperation] as ComparisonOperator,
      type: AbiType.Bool,
    } satisfies IRCondition;
  }

  return { kind: "call", target, args, returnType: AbiType.Int256, scope };
} 