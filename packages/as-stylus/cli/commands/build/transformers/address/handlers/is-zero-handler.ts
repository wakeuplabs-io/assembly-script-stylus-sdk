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
    // Legacy format
    if (expr.target.endsWith(".isZero")) return true;

    // New receiver-based format
    if (expr.target === "isZero" && expr.receiver) {
      return true; // Let AddressTransformer.canHandle() do the type checking
    }

    return false;
  }

  handle(expr: Call): EmitResult {
    // Handle legacy format - create receiver from target
    if (!expr.receiver && expr.target.endsWith(".isZero")) {
      const chain = expr.target.slice(0, -".isZero".length);
      expr.receiver = { kind: "var", name: chain, type: AbiType.Address, scope: "memory", isConstant: false };
    }

    // Ensure we have a receiver (should always be true after the above)
    if (!expr.receiver) {
      throw new Error("AddressIsZeroHandler called without receiver");
    }

    const recv = this.contractContext.emitExpression(expr.receiver);

    return {
      setupLines: [...recv.setupLines],
      valueExpr: `Address.isZero(${recv.valueExpr})`,
      valueType: "bool",
    };
  }
}
