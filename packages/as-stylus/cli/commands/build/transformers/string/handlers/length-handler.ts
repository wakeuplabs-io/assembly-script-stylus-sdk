import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * str.length() → Str.length(str)
 */
export class StrLengthHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".length");
  }

  handle(expr: any, ctx: EmitContext, emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    const recv = emit(expr.receiver, ctx);

    return {
      setupLines: [...recv.setupLines],
      valueExpr: `Str.length(${recv.valueExpr})`,
      valueType: "U256"
    };
  }
}
