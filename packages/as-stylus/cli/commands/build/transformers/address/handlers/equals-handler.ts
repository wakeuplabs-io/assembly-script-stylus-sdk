import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { convertVariableInParams } from "../../utils/convert-variable-in-params.js";

/** Handles address equality operations, transforming both static and instance calls to AssemblyScript format */
export class AddressEqualsHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  /** Checks if the expression is an address equality operation */
  canHandle(expr: Call): boolean {
    return (expr.target || "").endsWith(".equals");
  }

  /** Transforms address equality calls to Address.equals format */
  handle(expr: Call): EmitResult {
    if (expr.target === "Address.equals" && !expr.receiver) {
      const argResults = expr.args.map((arg) => this.contractContext.emitExpression(arg));
      return {
        setupLines: argResults.flatMap((r) => r.setupLines),
        valueExpr: `Address.equals(${argResults.map((r) => r.valueExpr).join(", ")})`,
        valueType: "bool",
      };
    }

    if (!expr.receiver && expr.target.endsWith(".equals")) {
      const chain = expr.target.slice(0, -".equals".length);
      expr.receiver = convertVariableInParams(chain, AbiType.Address);
      expr.target = "equals";
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
