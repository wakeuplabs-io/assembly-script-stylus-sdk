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
  
    const resultStr = makeTemp("strObj");
  
    if (arg.kind === "literal") {
      const raw: string = arg.value as string;
  
      const strPtr = makeTemp("strPtr");
      setup.push(`const ${strPtr}: usize = malloc(${raw.length});`);
      for (let i = 0; i < raw.length; ++i) {
        setup.push(`store<u8>(${strPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }
      setup.push(`const ${resultStr}: usize = Str.fromBytes(${strPtr}, ${raw.length});`);
    }
  
    else {
      setup.push(`const ${resultStr}: usize = ${argIR.valueExpr};`);
    }
  
    return {
      setupLines: setup,
      valueExpr: resultStr,
      valueType: "Str",
    };
  }

}
