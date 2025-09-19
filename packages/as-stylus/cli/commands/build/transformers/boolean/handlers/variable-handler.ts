import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Variable } from "@/cli/types/ir.types.js";

/**
 * Handler for boolean variables and their conversions
 * Handles variables that need conversion from bool → Boolean.create() for storage
 */
export class BooleanVariableHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "var" &&
      (expr.type === AbiType.Bool ||
        expr.originalType === "bool" ||
        expr.originalType === "boolean")
    );
  }

  handle(expr: Variable): EmitResult {
    if (expr.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `load_${expr.name}()`,
      };
    }

    return {
      setupLines: [],
      valueExpr: expr.name,
      valueType: expr.type || "boolean",
    };
  }
}
