// src/emit/transformers/str/handlers/slice-handler.ts
import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class StrSliceHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target.endsWith(".slice");
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
    expr : any,
    ctx  : EmitContext,
    emit : (e: any, c: EmitContext) => EmitResult
  ): EmitResult {

    /* ───── 1️⃣ normalizamos el receiver ───── */
    if (!expr.receiver) {
      const chain = expr.target.slice(0, -".slice".length);
      expr.receiver = this.makeReceiver(chain);
      expr.target   = "Str.slice";
    }

    /* ───── 2️⃣ emitimos los nodos originales ───── */
    const recvIR   = emit(expr.receiver, ctx);  // Str en storage
    const offIR    = emit(expr.args[0], ctx);   // palabra offset
    const lenIR    = emit(expr.args[1], ctx);   // palabra length

    /* ───── 3️⃣ temps para big-endian decode ───── */
    const offsetBE = makeTemp("offsetBE");
    const lengthBE = makeTemp("lengthBE");
    const sliceRes = makeTemp("sliceRes");
    const abiRes   = makeTemp("abiRes");

    const setup = [
      ...recvIR.setupLines,
      ...offIR.setupLines,
      ...lenIR.setupLines,

      `const ${offsetBE}: u32 = loadU32BE(${offIR.valueExpr} + 28);`,
      `const ${lengthBE}: u32 = loadU32BE(${lenIR.valueExpr} + 28);`,

      `const ${sliceRes}: usize = Str.slice(${recvIR.valueExpr}, ${offsetBE}, ${lengthBE});`,
      `const ${abiRes}:  usize = Str.toABI(${sliceRes});`,
    ];

    return {
      setupLines: setup,
      valueExpr : abiRes,   // puntero ABI listo para write_result
      valueType : "bytes",  // devuelvo buffer ABI, no un Str crudo
    };
  }
}
