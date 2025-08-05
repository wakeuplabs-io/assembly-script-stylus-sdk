import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
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
  constructor(contractContext: ContractContext) {
    super(contractContext, "U256");

    // Register specific handlers for different U256 operations
    this.registerHandler(new U256CreateHandler(contractContext));
    this.registerHandler(new U256CopyHandler(contractContext));
    this.registerHandler(new U256FromStringHandler(contractContext));
    this.registerHandler(new U256OperationHandler(contractContext));
    this.registerHandler(new U256ComparisonHandler(contractContext));
    this.registerHandler(new U256ToStringHandler(contractContext));
  }

  /**
   * Determines if this transformer can handle the given expression
   */
  canHandle(expr: IRExpression): boolean {
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
  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${expr.kind} */`,
      valueType: "U256",
    };
  }
}

