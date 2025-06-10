import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * str.slice(offset, length) → Str.slice(str, offset, length)
 */
export class StrSliceHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".slice");
  }

  handle(expr: any, ctx: EmitContext, emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    const recv = emit(expr.receiver, ctx);
    const offset = emit(expr.args[0], ctx);
    const length = emit(expr.args[1], ctx);

    return {
      setupLines: [...recv.setupLines, ...offset.setupLines, ...length.setupLines],
      valueExpr: `Str.slice(${recv.valueExpr}, ${offset.valueExpr}, ${length.valueExpr})`,
      valueType: "Str"
    };
  }
}
