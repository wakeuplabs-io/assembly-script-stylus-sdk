import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for I256Factory.create() expressions
 */
export class I256CreateHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "I256Factory.create";
  }

  /**
   * Processes I256Factory.create() expressions
   */
  handle(
    _expr: any,
    _context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: "I256.create()",
      valueType: "I256",
    };
  }
} 