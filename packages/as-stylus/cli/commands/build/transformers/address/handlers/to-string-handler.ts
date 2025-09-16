import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { ExpressionHandler as ConcreteExpressionHandler } from "@/transformers/expressions/expression-handler.js";

/**
 * <addr>.toString()  →  Address.toString(<addr>)
 */
export class AddressToStringHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    return target.endsWith(".toString");
  }

  handle(expr: Call): EmitResult {
    const receiverRes = new ConcreteExpressionHandler(this.contractContext).handle(expr.receiver!);
    const valueExpr = `Address.toString(${receiverRes.valueExpr})`;

    return {
      setupLines: [...receiverRes.setupLines],
      valueExpr,
      valueType: "string",
    };
  }
}
