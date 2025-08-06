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
    if (expr?.kind === "call") {
      const target = expr.target || "";

      if (expr.returnType !== AbiType.Int256) {
        return false;
      }

      // Factory methods
      if (target === "I256Factory.create" || target === "I256Factory.fromString" || target === "I256Factory.fromU256") {
        return true;
      }

      if (target === "I256.copy") {
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

      // Property and conversion methods
      if (target.endsWith(".isNegative") || target.endsWith(".negate") ||
          target.endsWith(".abs") || target.endsWith(".toString")) {
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
      valueExpr: `/* Error: Unsupported I256 expression: ${expr.kind} */`,
      valueType: "I256",
    };
  }
}
