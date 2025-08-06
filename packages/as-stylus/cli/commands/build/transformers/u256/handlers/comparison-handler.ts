import { EmitResult, EmitContext } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256 comparison methods (lessThan, greaterThan, equal, etc.)
 */
export class U256ComparisonHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return (
      target.endsWith(".lessThan") ||
      target.endsWith(".greaterThan") ||
      target.endsWith(".lessThanOrEqual") ||
      target.endsWith(".greaterThanOrEqual") ||
      target.endsWith(".equals") ||
      target.endsWith(".notEqual")
    );
  }

  handle(
    expr: any,
    context: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const [prop, method] = expr.target.split(".");

    const argRes = emit(expr.args[0], context);

    // Map method names to U256 static methods
    const methodMap: { [key: string]: string } = {
      lessThan: "lessThan",
      greaterThan: "greaterThan",
      lessThanOrEqual: "lessThanOrEqual",
      greaterThanOrEqual: "greaterThanOrEqual",
      equals: "equals",
      notEqual: "notEquals"
    };

    const staticMethod = methodMap[method] || method;

    // Contract property case (e.g., `contract.unsignedCounter.lessThan(x)`)
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.${staticMethod}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "boolean",
      };
    }

    // Regular object case (e.g., `value.lessThan(x)`)
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.${staticMethod}(${prop}, ${argRes.valueExpr})`,
      valueType: "boolean",
    };
  }
}
