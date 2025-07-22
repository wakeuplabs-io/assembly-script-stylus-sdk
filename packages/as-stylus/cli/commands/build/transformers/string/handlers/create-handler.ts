import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * strFactory.create() → Str.create()
 */
export class StrCreateHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "strFactory.create";
  }

  handle(_expr: any, _ctx: EmitContext, _emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    return {
      setupLines: [],
      valueExpr: "Str.create()",
      valueType: "Str"
    };
  }
}
