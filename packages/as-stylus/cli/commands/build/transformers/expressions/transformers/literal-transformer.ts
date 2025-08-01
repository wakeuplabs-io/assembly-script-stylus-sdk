import { AbiType } from "@/cli/types/abi.types.js";

import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { Literal } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transform literal expressions - pure function, no classes needed.
 */
export class LiteralTransformer implements IExpressionTransformer {
  canHandle(expr: Literal): boolean {
    return expr.kind === "literal";
  } 

  transform( expr: Literal,
  _context: EmitContext,
  _emitExpression: (expr: Literal, ctx: EmitContext) => EmitResult
): EmitResult {

  if (expr.type === AbiType.Bool) {
    return {
      setupLines: [],
      valueExpr: `${expr.value}`
    };
  }
  
  return {
    setupLines: [],
    valueExpr: `"${expr.value}"`
  };
}
}