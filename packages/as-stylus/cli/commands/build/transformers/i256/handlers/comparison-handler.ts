
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";


/**
 * Handler for I256 comparison methods (lessThan, greaterThan, equal, etc.)
 */
export class I256ComparisonHandler extends Handler {
  canHandle(expr: Call): boolean {
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

    const argRes = this.contractContext.emitExpression(expr.args[0]);

    // Map method names to I256 static methods
    const methodMap: { [key: string]: string } = {
      lessThan: "lessThan",
      greaterThan: "greaterThan",
      lessThanOrEqual: "lessThanOrEqual",
      greaterThanOrEqual: "greaterThanOrEqual",
      equals: "equals",
      notEqual: "notEquals"
    };

    const staticMethod = methodMap[method] || method;

    // Contract property case (e.g., `contract.signedCounter.lessThan(x)`)
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `I256.${staticMethod}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "boolean",
      };
    }

    // Regular object case (e.g., `value.lessThan(x)`)
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `I256.${staticMethod}(${prop}, ${argRes.valueExpr})`,
      valueType: "boolean",
    };
  }
} 