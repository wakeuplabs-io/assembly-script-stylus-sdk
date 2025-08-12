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
    
    // Handle new receiver-based IR structure
    if (expr.receiver) {
      return (
        target === "lessThan" ||
        target === "greaterThan" ||
        target === "lessThanOrEqual" ||
        target === "greaterThanOrEqual" ||
        target === "equals" ||
        target === "notEqual"
      );
    }
    
    // Handle legacy hybrid targets (backward compatibility)
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
    let receiverExpr: string;
    let method: string;
    
    // Handle new receiver-based IR structure
    if (expr.receiver) {
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      receiverExpr = receiverResult.valueExpr;
      method = expr.target;
    } else {
      // Handle legacy hybrid targets (backward compatibility)
      const [prop, methodName] = expr.target.split(".");
      receiverExpr = prop;
      method = methodName;
    }

    const argRes = this.contractContext.emitExpression(expr.args[0]);

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

    // Handle receiver setup lines for new IR structure
    let allSetupLines = [...argRes.setupLines];
    if (expr.receiver) {
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      allSetupLines = [...receiverResult.setupLines, ...allSetupLines];
    }

    // Contract property case (e.g., `contract.unsignedCounter.lessThan(x)`)
    if (expr.scope === "storage") {
      const propName = expr.receiver ? 
        (expr.receiver.kind === "var" ? expr.receiver.name : receiverExpr) :
        receiverExpr;
        
      return {
        setupLines: allSetupLines,
        valueExpr: `Boolean.fromABI(U256.${staticMethod}(load_${propName}(), ${argRes.valueExpr}))`,
        valueType: "boolean",
      };
    }

    // Regular object case (e.g., `value.lessThan(x)`) - MUST wrap in Boolean.fromABI
    return {
      setupLines: allSetupLines,
      valueExpr: `Boolean.fromABI(U256.${staticMethod}(${receiverExpr}, ${argRes.valueExpr}))`,
      valueType: "boolean",
    };
  }
}
