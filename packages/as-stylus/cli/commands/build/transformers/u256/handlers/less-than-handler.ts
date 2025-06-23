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
    const [prop] = expr.target.split(".");

    const argRes = emit(expr.args[0], context);

    // Contract property case (e.g., `MyToken.totalSupply.lessThan(x)`)
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.lessThan(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "boolean",
      };
    }

    // Regular object case (e.g., `value.lessThan(x)`)
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.lessThan(${prop}, ${argRes.valueExpr})`,
      valueType: "boolean",
    };
  }
}
