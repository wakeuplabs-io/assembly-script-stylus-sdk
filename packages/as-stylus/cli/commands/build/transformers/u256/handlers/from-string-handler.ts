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
 *  Then call `U256.setFromString(ptrU256, ptrStr, len)`.
 */
export class U256FromStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "U256Factory.fromString" &&
      expr.args.length === 1 &&
      ["literal", "var"].includes(expr.args[0].kind)
    );
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const arg = expr.args[0];
    const argRes = emit(arg, ctx);
    const setup = [...argRes.setupLines];

    const strPtr = makeTemp("hexPtr");
    const lenVar = makeTemp("hexLen");
    const u256Ptr = makeTemp("u256");

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

    setup.push(
      `const ${u256Ptr}: usize = U256.create();`,
      `U256.setFromString(${u256Ptr}, ${strPtr}, ${lenVar});`
    );

    return {
      setupLines: setup,
      valueExpr: u256Ptr,
      valueType: "U256",
    };
  }
}
