
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
    
/**
 * Handler for I256Factory.create() expressions
 */
export class I256CreateHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    return expr.target === "I256Factory.create";
  }

  /**
   * Processes I256Factory.create() expressions
   */
  handle(): EmitResult {
    return {
      setupLines: [],
      valueExpr: "I256.create()",
      valueType: "I256",
    };
  }
} 