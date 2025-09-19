import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256 toString method calls
 */
export class I256ToStringHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    return target.endsWith(".toString") && expr.args.length === 0;
  }

  /**
   * Processes I256 toString method calls
   */
  handle(expr: Call): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.toString(load_${prop}())`,
        valueType: "string",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.toString(${prop})`,
      valueType: "string",
    };
  }
}
