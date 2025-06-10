// src/cli/transformers/boolean/handlers/literal-handler.ts

import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for boolean literals
 */
export class BooleanLiteralHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "literal" && typeof expr.value === "boolean";
  }

  handle(
    expr: any,
    context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `allocBool(${expr.value})`,
      valueType: "boolean",
    };
  }
}
