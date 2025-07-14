// src/emit/transformers/address/handlers/has-code-handler.ts
import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler }        from "../../core/interfaces.js";

/**
 * a.hasCode()  ─►  Address.hasCode(a)
 */
export class AddressHasCodeHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".hasCode");
  }

  handle(
    expr: any,
    ctx : EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    // Reescritura para tomar el receiver explícito
    if (!expr.receiver && expr.target.endsWith(".hasCode")) {
      const chain = expr.target.slice(0, -".hasCode".length);
      expr.receiver = { kind: "var", name: chain };
    }
    const recv = emit(expr.receiver, ctx);

    return {
      setupLines: [...recv.setupLines],
      valueExpr : `Address.hasCode(${recv.valueExpr})`,
      valueType : "bool",
    };
  }
}
