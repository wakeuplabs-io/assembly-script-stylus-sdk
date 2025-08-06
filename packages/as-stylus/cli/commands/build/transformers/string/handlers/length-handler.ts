import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * str.length() → Str.length(str)
 */
export class StrLengthHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target.endsWith(".length");
  }

  handle(callExpression: Call): EmitResult {
    const recv = this.contractContext.emitExpression(callExpression.receiver!);

    return {
      setupLines: [...recv.setupLines],
      valueExpr: `Str.length(${recv.valueExpr})`,
      valueType: "U256"
    };
  }
}
