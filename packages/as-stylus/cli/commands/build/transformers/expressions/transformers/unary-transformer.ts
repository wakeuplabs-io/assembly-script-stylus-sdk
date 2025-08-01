
import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, IRUnaryExpression } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for unary expressions.
 * Handles unary operations like logical NOT, arithmetic negation, etc.
 */
export class UnaryTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "unary";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const unary = expr as IRUnaryExpression;
    const exprResult = emitExpression(unary.expr, context);
    
    // Handle boolean operations with Boolean class
    if (unary.op === "!" || unary.op === "not") {
      const result = unary.expr.kind === "call" ?
      `Boolean.not(Boolean.fromABI(${exprResult.valueExpr}))` : `Boolean.not(${exprResult.valueExpr})`;
      return {
        setupLines: exprResult.setupLines,
        valueExpr: result
      };
    }
    
    // Handle other unary operations
    return {
      setupLines: exprResult.setupLines,
      valueExpr: `${unary.op}${exprResult.valueExpr}`
    };
  }
}