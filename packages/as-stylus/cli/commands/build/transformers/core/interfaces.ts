import { EmitContext, EmitResult } from "../../../../types/emit.types";

/**
 * Interface for expression handlers that can process specific expression patterns
 * Each handler implements a strategy for handling a specific type of expression
 */
export interface ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean;
  
  /**
   * Processes the expression and returns the EmitResult
   */
  handle(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult;
}

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