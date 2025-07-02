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
  equal: "==",
  notEqual: "!=",
};

export function buildU256IR(target: string, call: CallExpression, symbolTable: SymbolTableStack): IRExpression {
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
    } satisfies IRCondition;
  }

  return { kind: "call", target, args, returnType: AbiType.Uint256, scope };
}

