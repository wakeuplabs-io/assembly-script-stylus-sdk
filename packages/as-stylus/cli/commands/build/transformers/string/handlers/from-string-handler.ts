import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";


export class StrFromStringHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "StrFactory.fromString" &&
      expr.args.length === 1 &&
      ["literal", "var"].includes(expr.args[0].kind)
    );
  }

  handle(expr: any, ctx: EmitContext, emit: (e: any, c: EmitContext) => EmitResult): EmitResult {
    const arg = expr.args[0];
    const argIR = emit(arg, ctx);
    const setup = [...argIR.setupLines];

    const strPtr = makeTemp("strPtr");
    const offsetBE = makeTemp("offsetBE");
    const lenPtr = makeTemp("lenPtr");
    const lenBE = makeTemp("lenBE");
    const dataPtr = makeTemp("dataPtr");
    const resultStr = makeTemp("strObj");

    if (arg.kind === "literal") {
      const raw: string = arg.value as string;

      setup.push(`const ${strPtr}: usize = malloc(${raw.length});`);
      for (let i = 0; i < raw.length; ++i) {
        setup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }
      setup.push(`const ${lenBE}: u32 = ${raw.length};`);
      setup.push(`const ${resultStr}: usize = Str.fromBytes(${strPtr}, ${lenBE});`);
    }

    else {
      setup.push(`const ${strPtr}: usize = ${argIR.valueExpr};`);
      setup.push(`const ${offsetBE}: u32 = loadU32BE(${strPtr} + 28);`);
      setup.push(`const ${lenPtr}: usize = ${strPtr} + ${offsetBE};`);
      setup.push(`const ${lenBE}: u32 = loadU32BE(${lenPtr} + 28);`);
      setup.push(`const ${dataPtr}: usize = ${lenPtr} + 32;`);
      setup.push(`const ${resultStr}: usize = Str.fromBytes(${dataPtr}, ${lenBE});`);
    }

    return {
      setupLines: setup,
      valueExpr: resultStr,
      valueType: "Str",
    };
  }

}
