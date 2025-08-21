import { AbiType } from "@/cli/types/abi.types.js";
import { IRStatement, IRExpression, Variable } from "@/cli/types/ir.types.js";

import { SymbolTableStack } from "../shared/symbol-table.js";
import { StructBaseBuilder } from "../struct/struct-base-builder.js";

export class StructAssignmentBuilder extends StructBaseBuilder {
  constructor(symbolTable: SymbolTableStack) {
    super(symbolTable);
  }

  buildIR(
  objectExpr: IRExpression,
  fieldName: string,
  valueExpr: IRExpression
): IRStatement {
  const structName = (objectExpr as Variable).name;
  const { fieldType, struct, structTemplate } = this.getStructInfo(structName, fieldName);
  const finalValueExpr = this.wrapValueWithCopyIfNeeded(valueExpr, fieldType);
  
  return {
    kind: "expr",
    expr: {
      kind: "call",
      target: `${structTemplate?.name}_set_${fieldName}`,
      args: [objectExpr, finalValueExpr],
      type: AbiType.Function,
      returnType: AbiType.Void,
      scope: struct?.scope ?? "memory"
    },
    type: AbiType.Void,
    };
  }
}