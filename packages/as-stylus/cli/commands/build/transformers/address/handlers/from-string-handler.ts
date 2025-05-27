import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * AddressFactory.fromString("0x…")
 *
 * 1. Reserves an empty Address
 * 2. Copies the string to linear memory
 * 3. Calls Address.setFromString
 * 4. Returns the pointer to the Address
 */
export class AddressFromStringHandler implements ExpressionHandler {

  canHandle(expr: any): boolean {
    return expr.kind === "call" && expr.target === "AddressFactory.fromString";
  }

  handle(
    expr : any,
    ctx  : EmitContext,
    emit : (e: any, c: EmitContext) => EmitResult
  ): EmitResult {

    // — traducimos el único argumento (la cadena) —
    const hexRes = emit(expr.args[0], ctx);

    // — variables temporales únicas —
    const addrVar = makeTemp("addr");
    const strVar  = makeTemp("hexPtr");
    const lenVar  = makeTemp("hexLen");

    return {
      /* líneas de setup (se insertan en el prólogo del scope actual) */
      setupLines: [
        ...hexRes.setupLines,
        `const ${strVar}: usize = __allocString(${hexRes.valueExpr});`,
        `const ${lenVar}: u32   = (${hexRes.valueExpr} as string).length;`,
        `const ${addrVar}: usize = Address.create();`,
        `Address.setFromString(${addrVar}, ${strVar}, ${lenVar});`
      ],

      /* el valor "resultante" de la expresión */
      valueExpr : addrVar,
      valueType : "Address"
    };
  }
}
