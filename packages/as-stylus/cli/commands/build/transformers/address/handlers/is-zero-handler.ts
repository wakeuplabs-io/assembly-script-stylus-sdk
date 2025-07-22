import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * a.isZero()  ─►  Address.isZero(a)
 */
export class AddressIsZeroHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".isZero");
  }

  handle(
    expr : any,
    ctx  : EmitContext,
    emit : (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".isZero")) {
      const chain = expr.target.slice(0, -".isZero".length);
      expr.receiver = { kind:"var", name: chain };
  }
    const recv = emit(expr.receiver, ctx);

    return {
      setupLines: [...recv.setupLines],
      valueExpr : `Address.isZero(${recv.valueExpr})`,
      valueType : "bool"
    };
  }
}
