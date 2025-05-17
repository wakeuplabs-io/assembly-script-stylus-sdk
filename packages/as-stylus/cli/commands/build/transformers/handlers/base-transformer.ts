import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { TypeTransformer } from "../core/interfaces.js";
import { ExpressionHandler } from "./expression-handler.js";

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
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    for (const handler of this.handlers) {
      if (handler.canHandle(expr)) {
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
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
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
