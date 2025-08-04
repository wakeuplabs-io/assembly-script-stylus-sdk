import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 operation methods (add, sub)
 */
export class I256OperationHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".add") || target.endsWith(".sub");
  }

  /**
   * Processes I256 operation method calls
   */
  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const [prop, op] = expr.target.split(".");

    const argRes = emitExprFn(expr.args[0], context);

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `I256.${op}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "I256",
      };
    }

    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `I256.${op}(${prop}, ${argRes.valueExpr})`,
      valueType: "I256",
    };
  }
} 