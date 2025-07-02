
import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

const returnType: Record<string, AbiType> = {
  "slice": AbiType.String,
  "length": AbiType.Uint256,
  "toString": AbiType.String,
  "toABI": AbiType.String,
  "fromString": AbiType.String,
  "create": AbiType.String,
  "fromABI": AbiType.String,
};

export function buildStringIR(target: string, call: CallExpression, symbolTable: SymbolTableStack): IRExpression {
  const [varName, operation] = target.split(".");
  const args = call.getArguments().map((arg) => {
    const builder = new ExpressionIRBuilder(arg as Expression);
    return builder.validateAndBuildIR();
  });

  const targetSymbol = symbolTable.lookup(varName);
  const scope = targetSymbol?.scope ?? "memory";

  return { kind: "call", target, args, returnType: returnType[operation], scope };
}

