import { AbiType } from "@/cli/types/abi.types.js";

import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, Variable } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transform variable expressions - pure function.
 */
export class VariableTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "var";
  }

   transform(
    expr: IRExpression,
  _context: EmitContext,
  _emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
): EmitResult {
  const variable = expr as Variable;
  
  if (variable.scope === "storage") {

    console.log("variable", variable, expr);
    if (variable.type === AbiType.Bool) {
      return {
        setupLines: [],
        valueExpr: `Boolean.fromABI(load_${variable.name}())`
      };
    }

    return {
      setupLines: [],
      valueExpr: `load_${variable.name}()`
    };
  }
  
  return {
    setupLines: [],
    valueExpr: variable.name
  };
}
}