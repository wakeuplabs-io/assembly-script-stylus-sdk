import { EmitResult, EmitContext } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * I256Factory.fromString(...)
 *
 *  - If the argument is a **literal** (`"0x…"` or `"-123"`) copy the bytes at compile-time
 *    using `store<u8>()`.
 *
 *  - If the argument is a **variable** (`string`) reserve bytes
 *    and copy at runtime using `memory.copy`.
 *
 *  Then call `I256.setFromString(ptrI256, ptrStr, len)`.
 */
export class I256FromStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "I256Factory.fromString" &&
      expr.args &&
      expr.args.length === 1
    );
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const [arg] = expr.args;

    // emit arg first
    const argRes = emit(arg, ctx);

    const i256Ptr = makeTemp("i256");
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
      setup.push(`const ${i256Ptr}: usize = I256.create();`);
      setup.push(`I256.setFromString(${i256Ptr}, ${strPtr}, ${lenVar});`);
    } else {
      setup.push(`const ${lenVar}: u32   = ${argRes.valueExpr};`);
      setup.push(`const ${strPtr}: usize = malloc(66);`);
      setup.push(
        `const ${i256Ptr}: usize = I256.create();`,
        `I256.setFromString(${i256Ptr}, ${strPtr}, ${lenVar});`
      );
    }

    return {
      setupLines: setup,
      valueExpr: i256Ptr,
      valueType: "I256",
    };
  }
} 