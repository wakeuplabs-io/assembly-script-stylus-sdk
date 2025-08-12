import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { METHOD_GROUPS } from "@/cli/types/method-types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for U256 operation methods (add, sub, mul, div, mod, pow)
 *
 * DEFAULT: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT: Unchecked arithmetic (wrapping behavior) with *Unchecked suffix
 */
export class U256OperationHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    // Handle new receiver-based IR structure
    if (expr.receiver) {
      const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
      const uncheckedMethods = arithmeticMethods.map((method) => `${method}Unchecked`);

      return (
        arithmeticMethods.includes(target as (typeof METHOD_GROUPS.ARITHMETIC)[number]) ||
        uncheckedMethods.includes(target)
      );
    }

    // Handle legacy hybrid targets (for backward compatibility)
    const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
    const uncheckedMethods = arithmeticMethods.map((method) => `${method}Unchecked`);

    return (
      arithmeticMethods.some((method) => target.endsWith(`.${method}`)) ||
      uncheckedMethods.some((method) => target.endsWith(`.${method}`))
    );
  }

  /**
   * Processes U256 operation method calls
   */
  handle(expr: Call): EmitResult {
    let operation: string;
    let receiverExpr: string;

    // Handle new receiver-based IR structure
    if (expr.receiver) {
      // Transform the receiver (e.g., variable, nested call)
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      receiverExpr = receiverResult.valueExpr;

      // Use the target directly as operation name
      operation = expr.target;
    } else {
      // Handle legacy hybrid targets (backward compatibility)
      const [prop, op] = expr.target.split(".");
      receiverExpr = prop;
      operation = op;
    }

    const argRes = this.contractContext.emitExpression(expr.args[0]);

    // Map operation names to U256 static methods - no change needed for receiver structure

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      // For storage operations with receiver structure, we need to extract the property name
      const propName = expr.receiver
        ? expr.receiver.kind === "var"
          ? expr.receiver.name
          : receiverExpr
        : receiverExpr.split(".")[0];

      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.${operation}(load_${propName}(), ${argRes.valueExpr})`,
        valueType: "U256",
      };
    }

    // Handle receiver setup lines for new IR structure
    let allSetupLines = [...argRes.setupLines];
    if (expr.receiver) {
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      allSetupLines = [...receiverResult.setupLines, ...allSetupLines];
    }

    // All operations return new values
    return {
      setupLines: allSetupLines,
      valueExpr: `U256.${operation}(${receiverExpr}, ${argRes.valueExpr})`,
      valueType: "U256",
    };
  }
}
