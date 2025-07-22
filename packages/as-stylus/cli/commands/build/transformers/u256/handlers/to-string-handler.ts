import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256 toString method calls
 */
export class U256ToStringHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".toString") && expr.args.length === 0;
  }

  /**
   * Processes U256 toString method calls
   */
  handle(
    expr: any,
  ): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `load_${prop}()`,
        valueType: "string",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `U256.toString(${prop})`,
      valueType: "string",
    };
  }
}
