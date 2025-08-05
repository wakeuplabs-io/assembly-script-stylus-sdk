import { AbiType } from "@/cli/types/abi.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { Literal } from "../../../../../types/ir.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

/**
 * Transform literal expressions - pure function, no classes needed.
 */
export class LiteralTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Literal): boolean {
    return expr.kind === "literal";
  } 

  handle( expr: Literal): EmitResult {
    if (expr.type === AbiType.Bool) {
      return {
        setupLines: [],
        valueExpr: `${expr.value}`
      };
    }
    
    return {
      setupLines: [],
      valueExpr: `"${expr.value}"`
    };
  }
}