import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { I256AbsHandler } from "./handlers/abs-handler.js";
import { I256ComparisonHandler } from "./handlers/comparison-handler.js";
import { I256CreateHandler } from "./handlers/create-handler.js";
import { I256FromStringHandler } from "./handlers/from-string-handler.js";
import { I256FromU256Handler } from "./handlers/from-u256-handler.js";
import { I256NegateHandler } from "./handlers/negate-handler.js";
import { I256OperationHandler } from "./handlers/operation-handler.js";
import { I256PropertyHandler } from "./handlers/property-handler.js";
import { I256ToStringHandler } from "./handlers/to-string-handler.js";
import { ContractContext } from "../core/contract-context.js";

/**
 * I256 transformer implementation using the modular handler pattern
 */
export class I256Transformer extends BaseTypeTransformer {
  /**
   * Creates and initializes a new I256 transformer with its handlers
   */
  constructor(contractContext: ContractContext) {
    super(contractContext, "I256");

    // Register specific handlers for different I256 operations
    this.registerHandler(new I256CreateHandler(contractContext));
    this.registerHandler(new I256FromStringHandler(contractContext));
    this.registerHandler(new I256FromU256Handler(contractContext));
    this.registerHandler(new I256OperationHandler(contractContext));
    this.registerHandler(new I256ComparisonHandler(contractContext));
    this.registerHandler(new I256PropertyHandler(contractContext));
    this.registerHandler(new I256NegateHandler(contractContext));
    this.registerHandler(new I256ToStringHandler(contractContext));
    this.registerHandler(new I256AbsHandler(contractContext));
  }

  /**
   * Determines if this transformer can handle the given expression
   */
  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";

    // Factory methods
    if (
      target === "I256Factory.create" ||
      target === "I256Factory.fromString" ||
      target === "I256Factory.fromU256"
    ) {
      return true;
    }

    if (target === "I256.copy") {
      return true;
    }

    // Check returnType first - this is the most reliable indicator
    if (expr.returnType === AbiType.Int256) {
      return true;
    }

    // For boolean return types, only match I256-specific methods
    if (expr.returnType === AbiType.Bool) {
      if (target.endsWith(".isNegative")) {
        // isNegative is only available on I256 variables
        return true;
      }

      // Comparison methods - only for I256 variables
      if (
        target.endsWith(".lessThan") ||
        target.endsWith(".greaterThan") ||
        target.endsWith(".lessThanOrEqual") ||
        target.endsWith(".greaterThanOrEqual") ||
        target.endsWith(".equals") ||
        target.endsWith(".notEqual")
      ) {
        return true;
      }
    }

    // For string return types, only match I256-specific methods
    if (expr.returnType === AbiType.String) {
      if (target.endsWith(".toString")) {
        // toString could be on any type, so we need to be more specific
        // For now, only match if it's explicitly an I256 method
        if (target.startsWith("I256.")) {
          return true;
        }
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
      valueExpr: `/* Error: Unsupported I256 expression: ${expr.kind} */`,
      valueType: "I256",
    };
  }
}
