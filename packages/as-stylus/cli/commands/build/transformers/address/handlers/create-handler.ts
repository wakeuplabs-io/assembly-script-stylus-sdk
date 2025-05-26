import { EmitContext, EmitResult } from "../../../../../types/emit.types";
import { ExpressionHandler } from "../../core/interfaces";

export class AddressCreateHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "AddressFactory.create";
  }

  handle(
    _expr: any,
    _ctx: EmitContext,
    _emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    return { setupLines: [], valueExpr: "Address.create()", valueType: "Address" };
  }
}
