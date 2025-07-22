import { EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 toString method calls
 */
export class I256ToStringHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".toString") && expr.args.length === 0;
  }

  /**
   * Processes I256 toString method calls
   */
  handle(
    expr: any,
  ): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.toString(load_${prop}())`,
        valueType: "string",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.toString(${prop})`,
      valueType: "string",
    };
  }
} 