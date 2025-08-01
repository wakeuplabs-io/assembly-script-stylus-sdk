import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, Member } from "../../../../../types/ir.types.js";
import { detectExpressionType, typeTransformers } from "../../core/base-transformer.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for member access expressions.
 * Handles property access on objects and storage properties.
 */
export class MemberTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "member";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const member = expr as Member;
    
    if (member.object.kind === "var" && member.object.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `load_${member.property}()`
      };
    }

    const typeName = detectExpressionType(expr);
    const transformer = typeName ? typeTransformers[typeName] : null;
    if (transformer && typeof transformer.emit === 'function') {
      return transformer.emit(expr, context, emitExpression);
    }
    
    const objResult = emitExpression(member.object, context);
    
    return {
      setupLines: objResult.setupLines,
      valueExpr: `${objResult.valueExpr}.${member.property}`
    };
  }
}