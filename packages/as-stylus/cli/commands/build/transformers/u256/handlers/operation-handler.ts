import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256 operation methods (add, sub, mul, div, mod, pow)
 * 
 * DEFAULT: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT: Unchecked arithmetic (wrapping behavior) with *Unchecked suffix
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
      target.endsWith(".pow") ||
      target.endsWith(".addUnchecked") ||
      target.endsWith(".subUnchecked") ||
      target.endsWith(".mulUnchecked") ||
      target.endsWith(".divUnchecked") ||
      target.endsWith(".modUnchecked") ||
      target.endsWith(".powUnchecked")
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

    // Map operation names to U256 static methods
    let operation = op;
    
    // DEFAULT: Checked arithmetic (new behavior)
    if (op === "add") operation = "add";
    else if (op === "sub") operation = "sub";
    else if (op === "mul") operation = "mul";
    else if (op === "div") operation = "div";
    else if (op === "mod") operation = "mod";
    else if (op === "pow") operation = "pow";
    
    // EXPLICIT: Unchecked arithmetic (wrapping behavior)
    else if (op === "addUnchecked") operation = "addUnchecked";
    else if (op === "subUnchecked") operation = "subUnchecked";
    else if (op === "mulUnchecked") operation = "mulUnchecked";
    else if (op === "divUnchecked") operation = "divUnchecked";
    else if (op === "modUnchecked") operation = "modUnchecked";
    else if (op === "powUnchecked") operation = "powUnchecked";

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.${operation}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "U256",
      };
    }

    // All operations return new values
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.${operation}(${prop}, ${argRes.valueExpr})`,
      valueType: "U256",
    };
  }
}
