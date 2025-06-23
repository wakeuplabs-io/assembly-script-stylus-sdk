
import { CallExpression, Expression } from "ts-morph";

import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

const returnType: Record<string, SupportedType> = {
  "slice": "Str",
  "length": "U256",
  "toString": "Str",
  "toABI": "Str",
  "fromString": "Str",
  "create": "Str",
  "fromABI": "Str",
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

