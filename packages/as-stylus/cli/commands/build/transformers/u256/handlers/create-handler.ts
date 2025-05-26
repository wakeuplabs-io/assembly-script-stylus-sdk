import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256Factory.create() expressions
 */
export class U256CreateHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "U256Factory.create";
  }

  /**
   * Processes U256Factory.create() expressions
   */
  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: "U256.create()",
      valueType: "U256",
    };
  }
}
