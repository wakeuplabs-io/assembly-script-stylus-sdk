import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

/**
 * Transform literal expressions - pure function, no classes needed.
 */
export class ThisTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "this";
  } 

  handle(): EmitResult {
    return {
      setupLines: [],
      valueExpr: ""
    };
  }
}