import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * a.isZero()  ─►  Address.isZero(a)
 */
export class AddressIsZeroHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target.endsWith(".isZero");
  }

  handle(expr: Call): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".isZero")) {
      const chain = expr.target.slice(0, -".isZero".length);
      expr.receiver = { kind:"var", name: chain, type: AbiType.Address, scope: "memory" };
  }
    const recv = this.contractContext.emitExpression(expr.receiver!);

    return {
      setupLines: [...recv.setupLines],
      valueExpr : `Address.isZero(${recv.valueExpr})`,
      valueType : "bool"
    };
  }
}
