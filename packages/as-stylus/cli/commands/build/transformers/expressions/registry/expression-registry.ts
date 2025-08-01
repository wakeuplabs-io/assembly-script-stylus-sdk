import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";
import { BinaryTransformer } from "../transformers/binary-transformer.js";
import { CallTransformer } from "../transformers/call-transformer.js";
import { ConditionTransformer } from "../transformers/condition-transformer.js";
import { FallbackTransformer } from "../transformers/fallback-transformer.js";
import { LiteralTransformer } from "../transformers/literal-transformer.js";
import { MappingTransformer } from "../transformers/mapping-transformer.js";
import { MemberTransformer } from "../transformers/member-transformer.js";
import { UnaryTransformer } from "../transformers/unary-transformer.js";
import { VariableTransformer } from "../transformers/variable-transformer.js";


type TransformerKind = "member" | "call" | "binary" | "condition" | "unary" | "literal" | "var" | "map_get" | "map_set" | "map_get2" | "map_set2" | "fallback";
/**
 * Ultra-simple transformer map using functions instead of classes.
 */
const transformers: Record<TransformerKind, IExpressionTransformer> = {
  member: new MemberTransformer(),
  call: new CallTransformer(),
  binary: new BinaryTransformer(),
  condition: new ConditionTransformer(),
  unary: new UnaryTransformer(),
  literal: new LiteralTransformer(),
  var: new VariableTransformer(),
  map_get: new MappingTransformer(),
  map_set: new MappingTransformer(),
  map_get2: new MappingTransformer(),
  map_set2: new MappingTransformer(),
  fallback: new FallbackTransformer(),
};

/**
 * Transform an expression using pure functions - simplest possible approach.
 */
export function transformExpression(
  expr: IRExpression,
  context: EmitContext,
  emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
): EmitResult {
  const transformer = transformers[expr.kind as TransformerKind];

  if (transformer) {
    return transformer.transform(expr, context, emitExpression);
  }
  console.log("transformer not found", expr.kind);
  return {
    setupLines: [],
    valueExpr: `/* Unsupported expression: ${expr.kind} */`
  };
}