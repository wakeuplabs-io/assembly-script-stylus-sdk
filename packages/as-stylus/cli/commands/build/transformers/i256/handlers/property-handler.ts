import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256 property methods without arguments (isNegative)
 */
export class I256PropertyHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    const canHandle = target.endsWith(".isNegative") && expr.args.length === 0;
    return canHandle;
  }

  /**
   * Processes I256 property method calls
   */
  handle(expr: Call): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.isNegative(load_${prop}())`,
        valueType: "boolean",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.isNegative(${prop})`,
      valueType: "boolean",
    };
  }
}
