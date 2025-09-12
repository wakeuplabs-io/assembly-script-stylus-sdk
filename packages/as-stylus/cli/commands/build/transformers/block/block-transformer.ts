import { EmitResult } from "@/cli/types/emit.types.js";
import { Member, Variable } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";

export class BlockTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Block");
  }

  canHandle(expr: Member): boolean {
    const object = expr.object as Variable;
    return object?.name === "block";
  }

  protected handleDefault(expr: Member): EmitResult {
    switch (expr.property) {
      case "timestamp":
        return {
          setupLines: [],
          valueExpr: "Block.timestamp()",
          valueType: "U256"
        };
      case "number":
        return {
          setupLines: [],
          valueExpr: "Block.number()",
          valueType: "U256"
        };
      case "coinbase":
        return {
          setupLines: [],
          valueExpr: "Block.coinbase()",
          valueType: "Address"
        };
      case "basefee":
        return {
          setupLines: [],
          valueExpr: "Block.basefee()",
          valueType: "U256"
        };
      case "gaslimit":
        return {
          setupLines: [],
          valueExpr: "Block.gaslimit()",
          valueType: "U256"
        };
      case "hasBasefee":
        return {
          setupLines: [],
          valueExpr: "Block.hasBasefee()",
          valueType: "boolean"
        };
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported block property: ${expr.property} */`,
          valueType: "unknown"
        };
    }
  }
}