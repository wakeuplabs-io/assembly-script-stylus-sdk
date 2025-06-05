import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * strFactory.fromString("hello") or strFactory.fromString(str)
 * 
 * If the argument is a literal, inline it with store<u8>().
 * Otherwise, runtime copy with memory.copy.
 */
export class StrFromStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "strFactory.fromString" &&
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

    const strPtr = makeTemp("str");
    const resultPtr = makeTemp("strObj");

    if (arg.kind === "literal") {
      const raw: string = arg.value as string;
      for (let i = 0; i < raw.length; ++i) {
        setup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }
      setup.push(`const ${resultPtr}: usize = Str.fromBytes(${strPtr}, ${raw.length});`);
    } else {
      setup.push(`const ${resultPtr}: usize = Str.fromBytes(${argRes.valueExpr}, memory.size(${argRes.valueExpr}));`);
    }

    return {
      setupLines: setup,
      valueExpr: resultPtr,
      valueType: "Str"
    };
  }
}
