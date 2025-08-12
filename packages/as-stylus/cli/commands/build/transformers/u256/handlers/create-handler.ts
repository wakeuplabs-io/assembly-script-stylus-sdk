import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/base-abstract-handlers.js";

/**
 * Handler for U256Factory.create() expressions
 */
export class U256CreateHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
    canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    
    // Legacy format
    if (expr.target === "U256Factory.create") return true;
    
    // Modern receiver-based format
    if (expr.target === "create" && expr.receiver) {
      return expr.receiver.kind === "var" && expr.receiver.name === "U256Factory";
    }

    return false;
  }

  /**
   * Processes U256Factory.create() expressions
   */
  handle(): EmitResult {
    return {
      setupLines: [],
      valueExpr: "U256.create()",
      valueType: "U256",
    };
  }
}
