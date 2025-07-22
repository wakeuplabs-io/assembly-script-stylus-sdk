import { EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 abs method that returns U256
 */
export class I256AbsHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".abs") && expr.args.length === 0;
  }

  /**
   * Processes I256 abs method calls
   */
  handle(
    expr: any,
  ): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.abs(load_${prop}())`,
        valueType: "U256",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.abs(${prop})`,
      valueType: "U256",
    };
  }
} 