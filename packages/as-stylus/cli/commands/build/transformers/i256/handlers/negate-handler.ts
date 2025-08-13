import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256 negate method
 */
export class I256NegateHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    return target.endsWith(".negate") && expr.args.length === 0;
  }

  /**
   * Processes I256 negate method calls
   */
  handle(expr: Call): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.negate(load_${prop}())`,
        valueType: "I256",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.negate(${prop})`,
      valueType: "I256",
    };
  }
} 