import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/interfaces.js";
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
export class U256FromStringHandler extends Handler {
  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "U256Factory.fromString" &&
      expr.args &&
      expr.args.length === 1
    );
  }

  handle(expr: Call): EmitResult {
    const [arg] = expr.args;

    // emit arg first
    const argRes = this.contractContext.emit(arg);

    const u256Ptr = makeTemp("u256");
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
      setup.push(`const ${u256Ptr}: usize = U256.create();`);
      setup.push(`U256.setFromString(${u256Ptr}, ${strPtr}, ${lenVar});`);
    } else {
      setup.push(`const ${lenVar}: u32   = ${argRes.valueExpr};`);
      setup.push(`const ${strPtr}: usize = malloc(66);`);
      setup.push(
        `const ${u256Ptr}: usize = U256.create();`,
        `U256.setFromString(${u256Ptr}, ${strPtr}, ${lenVar});`
      );
    }

    return {
      setupLines: setup,
      valueExpr: u256Ptr,
      valueType: "U256",
    };
  }
}
