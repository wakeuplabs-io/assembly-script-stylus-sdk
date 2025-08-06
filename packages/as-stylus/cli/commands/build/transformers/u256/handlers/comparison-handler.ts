import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/base-abstract-handlers.js";

/**
 * Handler for U256 comparison methods (lessThan, greaterThan, equal, etc.)
 */
export class U256ComparisonHandler extends Handler {
  canHandle(expr: IRExpression): boolean {
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

  handle(expr: Call): EmitResult {
    const [prop, method] = expr.target.split(".");

    const argRes = this.contractContext.emit(expr.args[0]);

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
