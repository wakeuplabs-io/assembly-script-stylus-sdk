import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * <str>.toString() → Str.toString(<str>)
 */
export class StrToStringHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target.endsWith(".toString");
  }

  handle(expr: Call): EmitResult {
    const recv = this.contractContext.emitExpression(expr.receiver!);
    return {
      setupLines: [...recv.setupLines],
      valueExpr: `Str.toString(${recv.valueExpr})`,
      valueType: "string"
    };
  }
}
