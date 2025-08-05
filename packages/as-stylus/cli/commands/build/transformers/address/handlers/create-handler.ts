import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

/**
 * AddressFactory.create()  →  Address.create()
 */
export class AddressCreateHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "call" && expr.target === "AddressFactory.create";
  }

  handle(_expr: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr : "Address.create()",
      valueType : "Address"
    };
  }
}
