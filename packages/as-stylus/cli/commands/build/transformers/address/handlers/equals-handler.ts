import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**  a.equals(b)  ⇒  Address.equals(a,b) */
export class AddressEqualsHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".equals");
  }

  handle(
    expr : any,
    ctx  : EmitContext,
    emit : (e: any, c: EmitContext) => EmitResult
  ): EmitResult {

    if (!expr.receiver && expr.target.endsWith(".equals")) {
      const chain = expr.target.slice(0, -".equals".length);
      expr.receiver = { kind:"var", name: chain };
      expr.target   = "Address.equals";
  }
    const left  = emit(expr.receiver, ctx);
    const right = emit(expr.args[0],  ctx);

    return {
      setupLines: [...left.setupLines, ...right.setupLines],
      valueExpr : `Address.equals(${left.valueExpr}, ${right.valueExpr})`,
      valueType : "bool"
    };
  }
}
