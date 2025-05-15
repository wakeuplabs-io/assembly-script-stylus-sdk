import { EmitContext, EmitResult } from "../../../types/emit.types";


export interface TypeTransformer {
  typeName: string;
  matchesType: (expr: any) => boolean;
  /**
   * Main method to emit code for an expression of this type
   * @param expr - The expression to emit
   * @param context - The emission context
   * @param emitExprFn - Function to emit nested expressions
   * @returns EmitResult with setup lines and value expression
   */
  emit: (expr: any, context: EmitContext, emitExprFn: (expr: any, ctx: EmitContext) => EmitResult) => EmitResult;
  generateLoadCode: (property: string) => string;
  generateStoreCode: (property: string, valueExpr: string) => string;
}

export const typeTransformers: Record<string, TypeTransformer> = {};

export function registerTransformer(transformer: TypeTransformer): void {
  typeTransformers[transformer.typeName] = transformer;
}

/**
 * Detects the most probable type of an expression by consulting all registered transformers.
 * If no transformer matches, applies a fallback logic for certain "call" expressions:
 *   - If the expression is a factory call (e.g., "U256Factory.create"), it infers the type from the factory name.
 *   - If any transformer can handle the method call (via canHandleMethodCall), it returns that type.
 * If neither the transformers nor the fallback logic match, returns null (default case).
 * 
 * @param expr - The IR expression to analyze.
 * @returns The type name if detected, or null if no transformer or fallback matches.
 */
export function detectExpressionType(expr: any): string | null {
  for (const typeName in typeTransformers) {
    if (typeTransformers[typeName].matchesType(expr)) {
      return typeName;
    }
  }
  
  return detectExpressionTypeFallback(expr);
}

function detectExpressionTypeFallback(expr: any): string | null {
  if (expr.kind === "call" && (expr.target.endsWith("Factory.create") || expr.target.endsWith("Factory.fromString"))) {
    const typeName = expr.target.split("Factory.")[0];
    return typeName;
  }

  return null;
}