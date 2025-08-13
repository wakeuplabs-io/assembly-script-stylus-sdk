import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { MethodName } from "@/cli/types/method-types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

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
export class U256FromStringHandler extends Handler {
  canHandle(expr: Call): boolean {
    if (!expr.args || expr.args.length !== 1) return false;

    // Legacy format
    if (expr.target === "U256Factory.fromString") return true;

    // Modern receiver-based format
    if (expr.target === MethodName.FromString && expr.receiver) {
      return expr.receiver.kind === "var" && expr.receiver.name === "U256Factory";
    }

    return false;
  }

  handle(expr: Call): EmitResult {
    const [arg] = expr.args;

    // emit arg first
    const argRes = this.contractContext.emitExpression(arg);

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
