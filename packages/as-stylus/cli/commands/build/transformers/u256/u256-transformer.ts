import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { U256ComparisonHandler } from "./handlers/comparison-handler.js";
import { U256CopyHandler } from "./handlers/copy-handler.js";
import { U256CreateHandler } from "./handlers/create-handler.js";
import { U256FromStringHandler } from "./handlers/from-string-handler.js";
import { U256FunctionCallHandler } from "./handlers/function-call-handler.js";
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
    this.registerHandler(new U256FunctionCallHandler(contractContext));
  }

  /**
   * Determines if this transformer can handle the given expression
   * Simplified approach following the copy-handler pattern
   */
  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    
    const target = expr.target || "";

    // Factory methods - always U256
    if (target === "U256Factory.create" || target === "U256Factory.fromString") {
      return true;
    }

    // Check returnType first - most reliable indicator
    // But exclude expressions that belong to structs
    if (expr.returnType === AbiType.Uint256) {
      if (expr.originalType || target.includes("_get_") || target.includes("_set_")) {
        return false;
      }
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
      if ((expr.returnType as AbiType) === AbiType.Uint256) {
        const u256Methods = [
          "mul",
          "add",
          "sub",
          "div",
          "mod",
          "pow",
          "copy",
          "toString",
        ];

        return methodName ? u256Methods.includes(methodName) : false;
      }

      const arg = expr.args[0];
      if (expr.returnType === AbiType.Bool) {
        const u256BoolMethods = [
          "lessThan",
          "greaterThan",
          "lessThanOrEqual",
          "greaterThanOrEqual",
          "equals",
          "notEqual",
        ];

        if (u256BoolMethods.includes(methodName || "")) {
          if (arg.type === AbiType.Uint256) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Handles expressions that don't match any registered handler
   */
  protected handleDefault(callExpression: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${JSON.stringify(callExpression) || ""} */`,
      valueType: "U256",
    };
  }
}

