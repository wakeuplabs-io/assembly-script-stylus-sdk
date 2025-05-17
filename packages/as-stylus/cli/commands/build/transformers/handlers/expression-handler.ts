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
