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
    // Legacy format
    if (expr.target === "AddressFactory.create") return true;
    
    // New receiver-based format
    if (expr.target === "create" && expr.receiver) {
      return expr.receiver.kind === "var" && expr.receiver.name === "AddressFactory";
    }
    
    return false;
  }

  handle(_expr: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr : "Address.create()",
      valueType : "Address"
    };
  }
}
