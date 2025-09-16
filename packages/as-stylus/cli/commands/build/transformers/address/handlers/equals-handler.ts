import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { convertVariableInParams } from "../../utils/convert-variable-in-params.js";

/** a.equals(b)  →  Address.equals(a,b)  */
export class AddressEqualsHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    return target.endsWith(".equals");
  }

  handle(expr: Call): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".equals")) {
      if (!expr.receiver) {
        const chain = expr.target.slice(0, -".equals".length);
        expr.receiver = convertVariableInParams(chain, AbiType.Address);
      }
      expr.target = "Address.equals";
    }

    const left = expr.receiver
      ? this.contractContext.emitExpression(expr.receiver)
      : { setupLines: [], valueExpr: "undefined" };
    const right = this.contractContext.emitExpression(expr.args[0]);

    return {
      setupLines: [...left.setupLines, ...right.setupLines],
      valueExpr: `Address.equals(${left.valueExpr}, ${right.valueExpr})`,
      valueType: "bool",
    };
  }
}
