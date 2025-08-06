import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";

/**
 * Handler for I256 abs method that returns U256
 */
export class I256AbsHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    return target.endsWith(".abs") && expr.args.length === 0;
  }

  /**
   * Processes I256 abs method calls
   */
  handle(expr: Call): EmitResult {
    const [prop] = expr.target.split(".");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `I256.abs(load_${prop}())`,
        valueType: "U256",
      };
    }

    // For regular object operations
    return {
      setupLines: [],
      valueExpr: `I256.abs(${prop})`,
      valueType: "U256",
    };
  }
} 