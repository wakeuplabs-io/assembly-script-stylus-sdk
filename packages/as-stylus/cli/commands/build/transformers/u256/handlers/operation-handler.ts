import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256 operation methods (add, sub, mul, div, mod, pow)
 */
export class U256OperationHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return (
      target.endsWith(".add") ||
      target.endsWith(".sub") ||
      target.endsWith(".mul") ||
      target.endsWith(".div") ||
      target.endsWith(".mod") ||
      target.endsWith(".pow")
    );
  }

  /**
   * Processes U256 operation method calls
   */
  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const [prop, op] = expr.target.split(".");

    // Handle operations with arguments
    const argRes = emitExprFn(expr.args[0], context);

    // Map operations to their checked versions for add/sub
    let operation = op;
    if (op === "add") {
      operation = "addChecked";
    } else if (op === "sub") {
      operation = "subChecked";
    }

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.${operation}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "U256",
      };
    }

    // All operations now return new values instead of modifying in-place
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.${operation}(${prop}, ${argRes.valueExpr})`,
      valueType: "U256",
    };
  }
}
