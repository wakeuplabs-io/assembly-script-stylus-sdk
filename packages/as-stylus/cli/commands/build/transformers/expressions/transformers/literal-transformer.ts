import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Literal } from "@/cli/types/ir.types.js";

/**
 * Transform literal expressions - pure function, no classes needed.
 */
export class LiteralTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Literal): boolean {
    return expr.kind === "literal";
  }

  handle(expr: Literal): EmitResult {
    if (expr.type === AbiType.Bool) {
      return {
        setupLines: [],
        valueExpr: `${expr.value}`,
      };
    }

    return {
      setupLines: [],
      valueExpr: `"${expr.value}"`,
    };
  }
}
