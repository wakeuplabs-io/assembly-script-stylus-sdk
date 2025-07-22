// src/emit/transformers/str/handlers/slice-handler.ts
import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class StrSliceHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".slice");
  }

  private makeReceiver(chain: string, scope: string): any {
    if (chain.indexOf(".") === -1) {
      return { kind: "var", name: chain, scope };
    }
    const [head, ...rest] = chain.split(".");
    let node: any = { kind: "var", name: head };
    for (const prop of rest) {
      node = { kind: "member", object: node, property: prop };
    }
    return node;
  }

  handle(
    expr : any,
    ctx  : EmitContext,
    emit : (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    // Normalize the receiver
    if (!expr.receiver) {
      const chain = expr.target.slice(0, -".slice".length);
      expr.receiver = this.makeReceiver(chain, expr.scope);
      expr.target   = "Str.slice";
    }

    // Emit the original nodes
    const recvIR   = emit(expr.receiver, ctx);
    const offIR    = emit(expr.args[0], ctx);
    const lenIR    = emit(expr.args[1], ctx);

    // Temps for big-endian decode
    const offsetBE = makeTemp("offsetBE");
    const lengthBE = makeTemp("lengthBE");
    const sliceRes = makeTemp("sliceRes");

    const setup = [
      ...recvIR.setupLines,
      ...offIR.setupLines,
      ...lenIR.setupLines,

      `const ${offsetBE}: u32 = loadU32BE(${offIR.valueExpr} + 28);`,
      `const ${lengthBE}: u32 = loadU32BE(${lenIR.valueExpr} + 28);`,

      `const ${sliceRes}: usize = Str.slice(${recvIR.valueExpr}, ${offsetBE}, ${lengthBE});`,
    ];

    return {
      setupLines: setup,
      valueExpr : sliceRes,
      valueType : "Str",
    };
  }
}
