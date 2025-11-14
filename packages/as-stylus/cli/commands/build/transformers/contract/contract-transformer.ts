import { EmitResult } from "@/cli/types/emit.types.js";
import { Member, Variable } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";

export class ContractTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Contract");
  }

  canHandle(expr: Member): boolean {
    const object = expr.object as Variable;
    return object?.name === "contract";
  }

  protected handleDefault(expr: Member): EmitResult {
    switch (expr.property) {
      case "address":
        return {
          setupLines: [],
          valueExpr: "Contract.address()",
          valueType: "Address",
        };
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported msg property: ${expr.property} */`,
          valueType: "unknown",
        };
    }
  }
}
