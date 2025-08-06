import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";


/**
 * a.hasCode()  ─►  Address.hasCode(a)
 */
export class AddressHasCodeHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target.endsWith(".hasCode");
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
