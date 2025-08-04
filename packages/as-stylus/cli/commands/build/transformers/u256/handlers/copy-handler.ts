import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class U256CopyHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".copy") && expr.args.length === 0;
  }

  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const target = expr.target || "";
    const dstPtr = makeTemp("u256Copy");

    if (target === "U256.copy" && expr.args.length === 1) {
      // Static method: U256.copy(src)
      const srcArg = emitExprFn(expr.args[0], context);
      return {
        setupLines: [
          ...srcArg.setupLines,
          `const ${dstPtr}: usize = U256.copyNew(${srcArg.valueExpr});`,
        ],
        valueExpr: dstPtr,
        valueType: "U256",
      };
    } else if (target.endsWith(".copy") && expr.args.length === 0) {
      // Instance method: variable.copy()
      const varName = target.replace(".copy", "");
      return {
        setupLines: [`const ${dstPtr}: usize = U256.copyNew(${varName});`],
        valueExpr: dstPtr,
        valueType: "U256",
      };
    }

    // Fallback (should not reach here if canHandle is correct)
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported copy expression: ${target} */`,
      valueType: "U256",
    };
  }
}
