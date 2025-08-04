import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256Factory.fromU256() expressions
 */
export class I256FromU256Handler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "I256Factory.fromU256" && expr.args.length === 1;
  }

  /**
   * Processes I256Factory.fromU256() expressions
   */
  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const u256ValueResult = emitExprFn(expr.args[0], context);

    return {
      setupLines: [...u256ValueResult.setupLines],
      valueExpr: `I256.fromU256(${u256ValueResult.valueExpr})`,
      valueType: "I256",
    };
  }
}
