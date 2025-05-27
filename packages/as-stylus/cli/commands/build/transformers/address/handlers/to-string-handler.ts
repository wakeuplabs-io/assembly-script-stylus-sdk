// src/emit/transformers/address/handlers/to-string-handler.ts
import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * <addr>.toString()  →  Address.toString(<addr>)
 */
export class AddressToStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".toString");
  }

  handle(
    expr: any,
    ctx : EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const receiverRes = emit(expr.receiver, ctx);
    const valueExpr = `Address.toString(${receiverRes.valueExpr})`;

    return {
      setupLines: [...receiverRes.setupLines],
      valueExpr,
      valueType : "string"
    };
  }
}
