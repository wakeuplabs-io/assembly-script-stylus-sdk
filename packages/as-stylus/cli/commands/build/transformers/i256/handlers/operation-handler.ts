import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";


/**
 * Handler for I256 operation methods (add, sub)
 */
export class I256OperationHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    return target.endsWith(".add") || target.endsWith(".sub");
  }

  /**
   * Processes I256 operation method calls
   */
  handle(expr: Call): EmitResult {
    const [prop, op] = expr.target.split(".");

    const argRes = this.contractContext.emit(expr.args[0]);

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `I256.${op}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "I256",
      };
    }

    // For regular object operations
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `I256.${op}(${prop}, ${argRes.valueExpr})`,
      valueType: "I256",
    };
  }
} 