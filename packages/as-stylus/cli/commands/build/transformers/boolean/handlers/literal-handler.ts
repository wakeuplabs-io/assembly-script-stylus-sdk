import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Literal } from "@/cli/types/ir.types.js";

/**
 * Handler for boolean literals
 */
export class BooleanLiteralHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "literal" && typeof expr.value === "boolean";
  }

  handle(expr: Literal): EmitResult {
    return {
      setupLines: [],
      valueExpr: `${expr.value}`,
      valueType: "boolean",
    };
  }
}
