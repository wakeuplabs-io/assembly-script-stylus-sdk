
import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

const returnType: Record<string, AbiType> = {
  "create": AbiType.Address,
  "equals": AbiType.Bool,
  "isZero": AbiType.Bool,
  "fromString": AbiType.Address,
  "topic": AbiType.Address,
};

export function buildAddressIR(target: string, call: CallExpression, symbolTable: SymbolTableStack): IRExpression {
  const [varName, operation] = target.split(".");
  const args = call.getArguments().map((arg) => {
    const builder = new ExpressionIRBuilder(arg as Expression);
    return builder.validateAndBuildIR();
  });

  const targetSymbol = symbolTable.lookup(varName);
  const scope = targetSymbol?.scope ?? "memory";

  return { kind: "call", target, args, type: AbiType.Function, returnType: returnType[operation], scope };
}

