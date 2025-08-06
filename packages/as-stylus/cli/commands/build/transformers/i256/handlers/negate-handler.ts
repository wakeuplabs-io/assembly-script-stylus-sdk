import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 negate method
 */
export class I256NegateHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".negate") && expr.args.length === 0;
  }

  /**
   * Processes I256 negate method calls
   */
  handle(
    expr: any,
    _context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.negate(load_${prop}())`,
        valueType: "I256",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.negate(${prop})`,
      valueType: "I256",
    };
  }
} 