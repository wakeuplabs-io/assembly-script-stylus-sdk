import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/** a.equals(b)  →  Address.equals(a,b)  */
export class AddressEqualsHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".equals");
  }

  private makeReceiver(chain: string): any {
    if (chain.indexOf(".") === -1) {
      return { kind: "var", name: chain };
    }
    const [head, ...rest] = chain.split(".");
    let node: any = { kind: "var", name: head };
    for (const prop of rest) {
      node = { kind: "member", object: node, property: prop };
    }
    return node;
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {

    if (!expr.receiver && expr.target.endsWith(".equals")) {
      expr.target     = "Address.equals";
      if(!expr.receiver) {
        const chain     = expr.target.slice(0, -".equals".length); // "A" ó "A.B"
        expr.receiver   = this.makeReceiver(chain);
      }
    }


    const left  = emit(expr.receiver, ctx);
    const right = emit(expr.args[0] , ctx);

    return {
      setupLines: [...left.setupLines, ...right.setupLines],
      valueExpr : `Address.equals(${left.valueExpr}, ${right.valueExpr})`,
      valueType : "bool",
    };
  }
}
