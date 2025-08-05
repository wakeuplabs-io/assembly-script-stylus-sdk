// src/emit/transformers/address/handlers/has-code-handler.ts
import { AbiType } from "@/cli/types/abi.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

/**
 * a.hasCode()  ─►  Address.hasCode(a)
 */
export class AddressHasCodeHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "call" && expr.target.endsWith(".hasCode");
  }

  handle(expr: Call): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".hasCode")) {
      const chain = expr.target.slice(0, -".hasCode".length);
      expr.receiver = { kind: "var", name: chain, type: AbiType.Address, scope: "memory" };
    }
    const recv = this.contractContext.emit(expr.receiver!);

    return {
      setupLines: [...recv.setupLines],
      valueExpr : `Address.hasCode(${recv.valueExpr})`,
      valueType : "bool",
    };
  }
}
