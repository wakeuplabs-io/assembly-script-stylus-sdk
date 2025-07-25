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
   */
  matchesType(expr: any): boolean {
    if (expr?.kind === "call") {
      const target = expr.target || "";

      // Factory methods
      if (target === "U256Factory.create" || target === "U256Factory.fromString") {
        return true;
      }

      if (target === "U256.copy") {
        return true;
      }

      // Arithmetic operations
      if (target.endsWith(".add") || target.endsWith(".sub")) {
        return true;
      }

      // Comparison methods
      if (target.endsWith(".lessThan") || target.endsWith(".greaterThan") ||
          target.endsWith(".lessThanOrEqual") || target.endsWith(".greaterThanOrEqual") ||
          target.endsWith(".equal") || target.endsWith(".notEqual")) {
        return true;
      }

      // Conversion methods
      if (target.endsWith(".toString")) {
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
    _context: EmitContext, 
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${expr.kind} */`,
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
