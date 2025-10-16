import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Variable } from "@/cli/types/ir.types.js";

/**
 * Transform variable expressions - pure function.
 */
export class VariableTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "var";
  }

  handle(variable: Variable): EmitResult {
    if (variable.scope === "memory") {

      if (variable.isConstant) {
        return {
          setupLines: [],
          valueExpr: `constant_${variable.name}()`,
        };
      }

      return {
        setupLines: [],
        valueExpr: variable.name,
      };
    }

    if (variable.type === AbiType.Struct) {
      const slot = `__SLOT${variable.slot!.toString(16).padStart(2, "0")}`;

      return {
        setupLines: [],
        valueExpr: slot,
      };
    }

    return {
      setupLines: [],
      valueExpr: `load_${variable.name}()`,
    };
  }
}
