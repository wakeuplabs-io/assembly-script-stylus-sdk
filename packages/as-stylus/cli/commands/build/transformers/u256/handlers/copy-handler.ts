import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class U256CopyHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" && 
      expr.target === "U256.copy" &&
      expr.args.length === 1
    );
  }

  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const srcArg = emitExprFn(expr.args[0], context);
    const dstPtr = makeTemp("u256Copy");

    return {
      setupLines: [
        ...srcArg.setupLines,
        `const ${dstPtr}: usize = U256.copyNew(${srcArg.valueExpr});`
      ],
      valueExpr: dstPtr,
      valueType: "U256",
    };
  }
} 