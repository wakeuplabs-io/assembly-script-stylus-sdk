import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * strFactory.create() → Str.create()
 */
export class StrCreateHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target === "strFactory.create";
  }

  handle(): EmitResult {
    return {
      setupLines: [],
      valueExpr: "Str.create()",
      valueType: "Str",
    };
  }
}
