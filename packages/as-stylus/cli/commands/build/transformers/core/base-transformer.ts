import { ExpressionHandler, TypeTransformer } from "./interfaces.js";
import { EmitContext, EmitResult } from "../../../../types/emit.types.js";

/**
 * Base class for type transformers that implements shared functionality
 * It uses the Chain of Responsibility pattern to delegate to specific expression handlers
 */
export abstract class BaseTypeTransformer implements TypeTransformer {
  typeName: string;
  private handlers: ExpressionHandler[] = [];

  /**
   * Creates a new transformer for the given type name
   */
  constructor(typeName: string) {
    this.typeName = typeName;
  }

  /**
   * Registers a handler that can process expressions of this type
   */
  protected registerHandler(handler: ExpressionHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Emits code for the given expression by finding an appropriate handler
   */
  emit(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    for (const handler of this.handlers) {
      if (handler.canHandle(expr)) {
        console.log({expr, handler});
        return handler.handle(expr, context, emitExprFn);
      }
    }
    return this.handleDefault(expr, context, emitExprFn);
  }

  /**
   * Handles expressions that don't match any registered handler
   */
  protected abstract handleDefault(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult;

  /**
   * Generates code to load a property of this type from storage
   */
  abstract generateLoadCode(property: string): string;

  /**
   * Generates code to store a value of this type to storage
   */
  abstract generateStoreCode(property: string, valueExpr: string): string;

  /**
   * Determines if this transformer can handle the given expression
   */
  abstract matchesType(expr: any): boolean;
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
  if (
    expr.kind === "call" &&
    (expr.target.endsWith("Factory.create") || expr.target.endsWith("Factory.fromString"))
  ) {
    const typeName = expr.target.split("Factory.")[0];
    return typeName;
  }

  return null;
}
