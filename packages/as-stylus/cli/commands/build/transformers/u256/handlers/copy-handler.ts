import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

export class U256CopyHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return (
      (target === "U256.copy" && expr.args.length === 1) ||
      (target.endsWith(".copy") && expr.args.length === 0)
    );
  }

  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const target = expr.target || "";

    if (target === "U256.copy" && expr.args.length === 1) {
      // Static method: U256.copy(src) - directly returns new instance
      const srcArg = emitExprFn(expr.args[0], context);
      return {
        setupLines: [...srcArg.setupLines],
        valueExpr: `U256.copy(${srcArg.valueExpr})`,
        valueType: "U256",
      };
    } else if (target.endsWith(".copy") && expr.args.length === 0) {
      // Instance method: variable.copy() - directly returns new instance
      const varName = target.replace(".copy", "");
      return {
        setupLines: [],
        valueExpr: `U256.copy(${varName})`,
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
