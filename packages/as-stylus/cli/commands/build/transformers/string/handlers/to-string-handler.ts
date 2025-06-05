import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * <str>.toString() → Str.toString(<str>)
 */
export class StrToStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".toString");
  }

  handle(expr: any, ctx: EmitContext, emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    const recv = emit(expr.receiver, ctx);
    return {
      setupLines: [...recv.setupLines],
      valueExpr: `Str.toString(${recv.valueExpr})`,
      valueType: "string"
    };
  }
}
