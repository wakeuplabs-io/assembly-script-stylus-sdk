import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { U256ComparisonHandler } from "./handlers/comparison-handler.js";
import { U256CopyHandler } from "./handlers/copy-handler.js";
import { U256CreateHandler } from "./handlers/create-handler.js";
import { U256FromStringHandler } from "./handlers/from-string-handler.js";
import { U256OperationHandler } from "./handlers/operation-handler.js";
import { U256ToStringHandler } from "./handlers/to-string-handler.js";

// Make sure to import this file in the main transformer index

/**
 * U256 transformer implementation using the modular handler pattern
 */
export class U256Transformer extends BaseTypeTransformer {
  /**
   * Creates and initializes a new U256 transformer with its handlers
   */
  constructor() {
    super("U256");

    // Register specific handlers for different U256 operations
    this.registerHandler(new U256CreateHandler());
    this.registerHandler(new U256CopyHandler());
    this.registerHandler(new U256FromStringHandler());
    this.registerHandler(new U256OperationHandler());
    this.registerHandler(new U256ComparisonHandler());
    this.registerHandler(new U256ToStringHandler());
  }

  /**
   * Determines if this transformer can handle the given expression
   * Simplified approach following the copy-handler pattern
   */
  matchesType(expr: any): boolean {
    if (expr?.kind !== "call") {
      return false;
    }

    const target = expr.target || "";

    // Factory methods - always U256
    if (target === "U256Factory.create" || target === "U256Factory.fromString") {
      return true;
    }

    // Check returnType first - most reliable indicator
    if (expr.returnType === "uint256") {
      return true;
    }

    // Static U256 methods
    if (target.startsWith("U256.")) {
      return true;
    }

    // Instance methods on variables - use returnType to determine if it's U256
    if (target.includes(".")) {
      const methodName = target.split(".").pop();
      
      // Use the IR's returnType to determine if this is a U256 operation
      if (expr.returnType === "uint256") {
        const u256Methods = [
          "mul", "add", "sub", "div", "mod", "pow",
          "lessThan", "greaterThan", "lessThanOrEqual", "greaterThanOrEqual",
          "equal", "notEqual", "copy", "toString"
        ];
        
        return methodName ? u256Methods.includes(methodName) : false;
      }
    }

    return false;
  }

  /**
   * Handles expressions that don't match any registered handler
   */
  protected handleDefault(
    expr: any,
    _context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${expr.kind} ${expr.target} */`,
      valueType: "U256",
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
export const U256TransformerInstance = new U256Transformer();
registerTransformer(U256TransformerInstance);
