import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression } from "../../../../../types/ir.types.js";

/**
 * Simple interface for expression transformers.
 * Much simpler - no need for canHandle since we use direct mapping.
 */
export interface IExpressionTransformer {
  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult;
}