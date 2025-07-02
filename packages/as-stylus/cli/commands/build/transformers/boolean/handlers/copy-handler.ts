import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";


export class BooleanCopyHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" && 
      expr.target === "boolean.copy" &&
      expr.args.length === 1
    );
  }

  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const srcArg = emitExprFn(expr.args[0], context);
    const dstPtr = makeTemp("boolCopy");

    // Use copyValue for direct boolean values (from function parameters)
    // Use copyNew for pointer-based booleans (from memory/storage)
    // Cast usize to u8 since entrypoint passes everything as usize
    const copyMethod = "Boolean.copyValue";

    return {
      setupLines: [
        ...srcArg.setupLines,
        `const ${dstPtr}: usize = ${copyMethod}(${srcArg.valueExpr});`
      ],
      valueExpr: dstPtr,
      valueType: "boolean",
    };
  }
} 