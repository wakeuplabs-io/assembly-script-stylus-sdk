import { EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 property methods without arguments (isNegative)
 */
export class I256PropertyHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    const canHandle = target.endsWith(".isNegative") && expr.args.length === 0;
    return canHandle;
  }

  /**
   * Processes I256 property method calls
   */
  handle(
    expr: any,
  ): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.isNegative(load_${prop}())`,
        valueType: "boolean",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.isNegative(${prop})`,
      valueType: "boolean",
    };
  }
} 