import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * AddressFactory.fromString(...)
 *
 *  - If the argument is a **literal** (`"0x…"`) copy the bytes at compile-time
 *    using `store<u8>()`.
 *
 *  - If the argument is a **variable** (`string`) reserve 42 bytes
 *    (`"0x" + 40 nibbles`) and copy at runtime using `memory.copy`.
 *
 *  Then call `Address.setFromString(ptrAddr, ptrStr, len)`.
 */
export class AddressFromStringHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "AddressFactory.fromString" &&
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
    const addrPtr = makeTemp("addr");

    if (arg.kind === "literal") {

      const raw: string = arg.value as string;
      const strLen: number = raw.length;

      for (let i = 0; i < strLen; ++i) {
        setup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }

    }

    setup.push(
      `const ${addrPtr}: usize = Address.fromBytes(${argRes.valueExpr});`,
    );

    return {
      setupLines: setup,
      valueExpr: addrPtr,
      valueType: "Address"
    };
  }
}
