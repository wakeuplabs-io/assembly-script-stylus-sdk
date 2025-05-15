import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { registerTransformer } from "../types.js";
import { BaseTypeTransformer } from "../handlers/base-transformer.js";
import { U256CreateHandler } from "../handlers/u256/create-handler.js";
import { U256FromStringHandler } from "../handlers/u256/from-string-handler.js";
import { U256OperationHandler } from "../handlers/u256/operation-handler.js";
import { U256ToStringHandler } from "../handlers/u256/to-string-handler.js";

/**
 * U256 transformer implementation using the modular handler pattern
 */
export class U256TransformerImpl extends BaseTypeTransformer {
  /**
   * Creates and initializes a new U256 transformer with its handlers
   */
  constructor() {
    super("U256");
    
    // Register specific handlers for different U256 operations
    this.registerHandler(new U256CreateHandler());
    this.registerHandler(new U256FromStringHandler());
    this.registerHandler(new U256OperationHandler());
    this.registerHandler(new U256ToStringHandler());
  }
  
  /**
   * Determines if this transformer can handle the given expression
   */
  matchesType(expr: any): boolean {
    if (expr.kind === "call") {
      const target = expr.target || "";
      
      // Factory methods
      if (target === "U256Factory.create" || target === "U256Factory.fromString") {
        return true;
      }
      
      // Instance methods
      if (target.endsWith(".add") || target.endsWith(".sub") || target.endsWith(".toString")) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Handles expressions that don't match any registered handler
   */
  protected handleDefault(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${expr.kind} */`,
      valueType: "U256"
    };
  }
  
  /**
   * Generates code to load a U256 value from storage
   */
  generateLoadCode(property: string): string {
    return `load_${property}()`;
  }
  
  /**
   * Generates code to store a U256 value to storage
   */
  generateStoreCode(property: string, valueExpr: string): string {
    return `store_${property}(${valueExpr});`;
  }
}

// Export concrete instance and register it
export const U256Transformer = new U256TransformerImpl();
registerTransformer(U256Transformer);
