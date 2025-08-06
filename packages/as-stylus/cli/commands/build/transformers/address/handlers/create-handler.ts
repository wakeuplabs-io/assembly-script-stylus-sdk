import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * AddressFactory.create()  →  Address.create()
 */
export class AddressCreateHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target === "AddressFactory.create";
  }

  handle(_expr: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr : "Address.create()",
      valueType : "Address"
    };
  }
}
