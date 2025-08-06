import { EmitResult, EmitContext } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * U256Factory.fromString(...)
 *
 *  - If the argument is a **literal** (`"0x…"`) copy the bytes at compile-time
 *    using `store<u8>()`.
 *
 *  - If the argument is a **variable** (`string`) reserve 66 bytes
 *    (`"0x" + 64 hex digits`) and copy at runtime using `memory.copy`.
 *
 *  Then call `U256.fromString(ptrStr, len)` which returns a new U256.
 */
export class U256FromStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "U256Factory.fromString" &&
      expr.args &&
      expr.args.length === 1
    );
  }

  handle(expr: any, ctx: EmitContext, emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    const [arg] = expr.args;

    // emit arg first
    const argRes = emit(arg, ctx);

    const strPtr = makeTemp("str");
    const lenVar = makeTemp("len");

    const setup: string[] = [...argRes.setupLines];

    if (arg.kind === "literal") {
      const raw: string = arg.value as string;
      const strLen: number = raw.length;

      setup.push(`const ${strPtr}: usize = malloc(${strLen});`);
      for (let i = 0; i < strLen; ++i) {
        setup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }
      setup.push(`const ${lenVar}: u32 = ${strLen};`);
    } else {
      setup.push(`const ${lenVar}: u32   = ${argRes.valueExpr};`);
      setup.push(`const ${strPtr}: usize = malloc(66);`);
    }

    return {
      setupLines: setup,
      valueExpr: `U256.fromString(${strPtr}, ${lenVar})`,
      valueType: "U256",
    };
  }
}
