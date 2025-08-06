import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256Factory.fromU256() expressions
 */
export class I256FromU256Handler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    return (
      expr.target === "I256Factory.fromU256" &&
      expr.args.length === 1
    );
  }

  /**
   * Processes I256Factory.fromU256() expressions
   */
  handle(expr: Call): EmitResult {
    const u256ValueResult = this.contractContext.emit(expr.args[0]);

    return {
      setupLines: [...u256ValueResult.setupLines],
      valueExpr: `I256.fromU256(${u256ValueResult.valueExpr})`,
      valueType: "I256",
    };
  }
}
