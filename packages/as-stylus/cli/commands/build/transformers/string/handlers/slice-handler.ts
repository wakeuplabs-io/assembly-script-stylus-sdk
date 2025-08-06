// src/emit/transformers/str/handlers/slice-handler.ts
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class StrSliceHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target.endsWith(".slice");
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

  handle(expr: Call): EmitResult {
    // Normalize the receiver
    if (!expr.receiver) {
      const chain = expr.target.slice(0, -".slice".length);
      expr.receiver = this.makeReceiver(chain, expr.scope);
      expr.target   = "Str.slice";
    }

    // Emit the original nodes
    const recvIR   = this.contractContext.emit(expr.receiver!);
    const offIR    = this.contractContext.emit(expr.args[0]);
    const lenIR    = this.contractContext.emit(expr.args[1]);

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
