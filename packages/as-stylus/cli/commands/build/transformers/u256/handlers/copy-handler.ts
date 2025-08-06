import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

export class U256CopyHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    if (!expr?.target) return false;
    
    return (
      (expr.target === "U256.copy" && expr.args.length === 1) ||
      (expr.target.endsWith(".copy") && expr.args.length === 0)
    );
  }

  handle(callExpression: Call): EmitResult {
    const target = callExpression.target || "";
    if (target === "U256.copy" && callExpression.args.length === 1) {
      // Static method: U256.copy(src) - directly returns new instance
      const srcArg = this.contractContext.emit(callExpression.args[0]);
      return {
        setupLines: [...srcArg.setupLines],
        valueExpr: `U256.copy(${srcArg.valueExpr})`,
        valueType: "U256",
      };
    } else if (target.endsWith(".copy") && callExpression.args.length === 0) {
      // Instance method: variable.copy() - directly returns new instance
      const varName = target.replace(".copy", "");
      return {
        setupLines: [],
        valueExpr: `U256.copy(${varName})`,
        valueType: "U256",
      };
    }

    // Fallback (should not reach here if canHandle is correct)
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported copy expression: ${callExpression.target} */`,
      valueType: "U256",
    };
  }
}
