import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Fallback transformer for unsupported expressions.
 * This transformer handles any expression that doesn't have a specific transformer.
 * It provides a safety net and debugging information for unsupported cases.
 */
export class FallbackTransformer implements IExpressionTransformer {
  canHandle(_expr: IRExpression): boolean {
    // Fallback transformer can handle any expression
    return true;
  }

  transform(
    expr: IRExpression,
    _context: EmitContext,
    _emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    // Log the unsupported expression for debugging
    console.warn(`[FallbackTransformer] Unsupported expression kind: ${expr.kind}`, expr);
    
    return {
      setupLines: [],
      valueExpr: `/* Unsupported expression: ${expr.kind} */`
    };
  }
}