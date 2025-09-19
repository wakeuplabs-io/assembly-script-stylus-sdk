import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256 operation methods (add, sub, mul, div, mod)
 *
 * DEFAULT: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT: Unchecked arithmetic (wrapping behavior) with *Unchecked suffix
 */
export class I256OperationHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    // Handle new receiver-based IR structure
    if (expr.receiver) {
      return (
        target === "add" ||
        target === "sub" ||
        target === "mul" ||
        target === "div" ||
        target === "mod" ||
        target === "addUnchecked" ||
        target === "subUnchecked" ||
        target === "mulUnchecked" ||
        target === "divUnchecked" ||
        target === "modUnchecked"
      );
    }

    // Handle legacy hybrid targets (for backward compatibility)
    return (
      target.endsWith(".add") ||
      target.endsWith(".sub") ||
      target.endsWith(".mul") ||
      target.endsWith(".div") ||
      target.endsWith(".mod") ||
      target.endsWith(".addUnchecked") ||
      target.endsWith(".subUnchecked") ||
      target.endsWith(".mulUnchecked") ||
      target.endsWith(".divUnchecked") ||
      target.endsWith(".modUnchecked")
    );
  }

  /**
   * Processes I256 operation method calls
   */
  handle(expr: Call): EmitResult {
    let operation: string;
    let receiverExpr: string;

    // Handle new receiver-based IR structure
    if (expr.receiver) {
      // Transform the receiver (e.g., variable, nested call)
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      receiverExpr =
        receiverResult.setupLines.length > 0
          ? receiverResult.setupLines.join("\n") + "\n" + receiverResult.valueExpr
          : receiverResult.valueExpr;

      // Use the target directly as operation name
      operation = expr.target;
    } else {
      // Handle legacy hybrid targets (backward compatibility)
      const [prop, op] = expr.target.split(".");
      receiverExpr = prop;
      operation = op;
    }

    const argRes = this.contractContext.emitExpression(expr.args[0]);

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
        valueExpr: `I256.${operation}(load_${propName}(), ${argRes.valueExpr})`,
        valueType: "I256",
      };
    }

    // All operations return new values
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `I256.${operation}(${receiverExpr}, ${argRes.valueExpr})`,
      valueType: "I256",
    };
  }
}
