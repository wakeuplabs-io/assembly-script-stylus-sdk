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
    if (variable.scope === "storage") {
      if (variable.type === AbiType.Bool) {
        return {
          setupLines: [],
          valueExpr: `Boolean.fromABI(load_${variable.name}())`
        };
      }

      return {
        setupLines: [],
        valueExpr: `load_${variable.name}()`
      };
    }
    
    return {
      setupLines: [],
      valueExpr: variable.name
    };
  }
}