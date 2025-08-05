import { Call } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";
import { ExpressionHandler as ConcreteExpressionHandler } from "../../expressions/expression-handler.js";

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
      valueType : "string"
    };
  }
}
