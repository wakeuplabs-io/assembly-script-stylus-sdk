import { EmitContext, EmitResult }   from "../../../../../types/emit.types";
import { ExpressionHandler }         from "../../core/interfaces";
import { makeTemp }                  from "../../utils/temp-factory.js";

/**
 * U256Factory.fromString("0x…")
 *
 */
export class U256FromStringHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return (
      expr.kind   === "call" &&
      expr.target === "U256Factory.fromString" &&
      expr.args.length === 1 &&
      expr.args[0].kind === "literal"
    );
  }

  handle(
    expr : any,
    _ctx : EmitContext,
    _emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {

    const rawHex : string = expr.args[0].value as string;
    const strLen : number = rawHex.length;

    const strPtr  = makeTemp("hexPtr");
    const u256Ptr = makeTemp("u256");

    const setupLines: string[] = [
      `const ${strPtr}: usize = malloc(${strLen});`
    ];

    for (let i = 0; i < strLen; ++i) {
      const code = rawHex.charCodeAt(i);
      setupLines.push(`store<u8>(${strPtr} + ${i}, ${code});`);
    }

    setupLines.push(`const ${u256Ptr}: usize = U256.create();`);
    setupLines.push(
      `U256.setFromString(${u256Ptr}, ${strPtr}, ${strLen});`
    );
    return {
      setupLines,
      valueExpr: u256Ptr,
      valueType: "U256"
    };
  }
}
