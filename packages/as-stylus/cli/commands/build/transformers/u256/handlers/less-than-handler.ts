import { EmitResult, EmitContext } from "@/cli/types/emit.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * U256.lessThan(...) handler
 *
 * Matches calls like: `a.lessThan(b)`
 */
export class U256LessThanHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".lessThan");
  }

  handle(
    expr: any,
    context: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const parts = expr.target.split(".");
    const cls = parts[0];
    const prop = parts.length >= 3 ? parts[1] : null;

    const argRes = emit(expr.args[0], context);

    // Contract property case (e.g., `MyToken.totalSupply.lessThan(x)`)
    if (cls === context.contractName && prop) {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.lessThan(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "boolean",
      };
    }

    // Regular object case (e.g., `value.lessThan(x)`)
    const targetObj = parts.slice(0, -1).join(".");
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.lessThan(${targetObj}, ${argRes.valueExpr})`,
      valueType: "boolean",
    };
  }
}
