import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";
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

    const recv = emit(expr.receiver, ctx);

    return {
      setupLines: [...recv.setupLines],
      valueExpr : `Address.isZero(${recv.valueExpr})`,
      valueType : "bool"
    };
  }
}
