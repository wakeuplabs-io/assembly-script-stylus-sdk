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
   * Gets all valid arithmetic method names (checked and unchecked)
   */
  private getArithmeticMethods(): readonly string[] {
    const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
    const uncheckedMethods = arithmeticMethods.map((method) => `${method}Unchecked`);
    return [...arithmeticMethods, ...uncheckedMethods];
  }

  /**
   * Extracts the property name from the receiver for storage operations
   */
  private extractStoragePropertyName(expr: Call, receiverExpr: string): string {
    if (expr.receiver) {
      // For new receiver-based IR structure
      return expr.receiver.kind === "var" ? expr.receiver.name : receiverExpr;
    }
    // For legacy hybrid targets
    return receiverExpr.split(".")[0];
  }

  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    const validMethods = this.getArithmeticMethods();

    if (expr.receiver) {
      return validMethods.includes(target);
    }

    // Handle legacy hybrid targets (for backward compatibility)
    return validMethods.some((method) => target.endsWith(`.${method}`));
  }

  /**
   * Processes U256 operation method calls
   */
  handle(expr: Call): EmitResult {
    // Process receiver once at the beginning and reuse the result
    let receiverResult: EmitResult | null = null;
    let receiverExpr: string;
    let operation: string;

    if (expr.receiver) {
      // Handle new receiver-based IR structure
      receiverResult = this.contractContext.emitExpression(expr.receiver);
      receiverExpr = receiverResult.valueExpr;
      operation = expr.target;
    } else {
      // Handle legacy hybrid targets (backward compatibility)
      const terms = expr.target.split(".");
      const prop = terms.slice(0, -1).join(".");
      const op = terms.slice(-1)[0];
      receiverExpr = prop;
      operation = op;
    }

    const argResult = this.contractContext.emitExpression(expr.args[0]);

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      const propName = this.extractStoragePropertyName(expr, receiverExpr);
      return {
        setupLines: [...argResult.setupLines],
        valueExpr: `U256.${operation}(load_${propName}(), ${argResult.valueExpr})`,
        valueType: "U256",
      };
    }

    // Combine setup lines: receiver first (if exists), then argument
    const allSetupLines = receiverResult
      ? [...receiverResult.setupLines, ...argResult.setupLines]
      : [...argResult.setupLines];

    // All operations return new values
    return {
      setupLines: allSetupLines,
      valueExpr: `U256.${operation}(${receiverExpr}, ${argResult.valueExpr})`,
      valueType: "U256",
    };
  }
}
