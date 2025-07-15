import { EmitResult, EmitContext } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp, addGlobalTemp } from "../../utils/temp-factory.js";

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
    const i256Ptr = makeTemp("i256");

    if (arg.kind === "literal") {
      const raw: string = arg.value as string;
      const strLen: number = raw.length;

      // For literals, we need to create global constants
      // Create the malloc call first
      const mallocCall = `malloc(${strLen})`;
      addGlobalTemp(strPtr, mallocCall);

      // Build the setup for the string content
      const contentSetup: string[] = [];
      for (let i = 0; i < strLen; ++i) {
        contentSetup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }

      // Add length as global constant
      addGlobalTemp(lenVar, strLen.toString());
      
      // Add I256 creation as global constant  
      addGlobalTemp(i256Ptr, "I256.create()");

      // The setup lines now just do the store operations and setFromString
      setup.push(...contentSetup);
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