import { AbiType } from "@/cli/types/abi.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { IRExpression, Variable } from "../../../../../types/ir.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

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