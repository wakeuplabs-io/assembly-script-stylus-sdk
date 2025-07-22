// src/cli/transformers/boolean/handlers/literal-handler.ts

import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Literal } from "@/cli/types/ir.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for boolean literals
 */
export class BooleanLiteralHandler implements ExpressionHandler {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "literal" && typeof expr.value === "boolean";
  }

  handle(
    expr: Literal,
    _context: EmitContext,
    _emitExprFn: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `${expr.value}`,
      valueType: "boolean",
    };
  }
}
