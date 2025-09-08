import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

import { convertVariableInParams } from "../../utils/convert-variable-in-params.js";


/**
 * Handler for I256 operation methods (add, sub, mul, div, mod)
 * 
 * DEFAULT: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT: Unchecked arithmetic (wrapping behavior) with *Unchecked suffix
 */
export class StrEqualsHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";
    return (
      target.endsWith(".equals")
    );
  }

  /**
   * Processes I256 operation method calls
   */
  handle(expr: Call): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".equals")) {
      
      if (!expr.receiver) {
        const chain = expr.target.slice(0, -".equals".length);
        expr.receiver = convertVariableInParams(chain, AbiType.String);
      }
      expr.target = "Str.equals";
    }


    const left = expr.receiver ? this.contractContext.emitExpression(expr.receiver) : { setupLines: [], valueExpr: "undefined" };
    const right = this.contractContext.emitExpression(expr.args[0]);

    return {
      setupLines: [...left.setupLines, ...right.setupLines],
      valueExpr: `Str.equals(${left.valueExpr}, ${right.valueExpr})`,
      valueType: "bool",
    };
  }
}
