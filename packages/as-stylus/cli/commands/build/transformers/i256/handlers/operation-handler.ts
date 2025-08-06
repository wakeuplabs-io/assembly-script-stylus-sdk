import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256 operation methods (add, sub, mul, div, mod)
 * 
 * DEFAULT: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT: Unchecked arithmetic (wrapping behavior) with *Unchecked suffix
 */
export class I256OperationHandler implements ExpressionHandler {
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
      target.endsWith(".addUnchecked") ||
      target.endsWith(".subUnchecked") ||
      target.endsWith(".mulUnchecked") ||
      target.endsWith(".divUnchecked") ||
      target.endsWith(".modUnchecked")
    );
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

    let operation = op;
    
    if (op === "add") operation = "add";
    else if (op === "sub") operation = "sub";
    else if (op === "mul") operation = "mul";
    else if (op === "div") operation = "div";
    else if (op === "mod") operation = "mod";
    else if (op === "addUnchecked") operation = "addUnchecked";
    else if (op === "subUnchecked") operation = "subUnchecked";
    else if (op === "mulUnchecked") operation = "mulUnchecked";
    else if (op === "divUnchecked") operation = "divUnchecked";
    else if (op === "modUnchecked") operation = "modUnchecked";

    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `I256.${operation}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "I256",
      };
    }

    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `I256.${operation}(${prop}, ${argRes.valueExpr})`,
      valueType: "I256",
    };
  }
}
