import { IRExpression, Member, Variable } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";

export class MsgTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Msg");
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "member" && 
           expr.object?.kind === "var" && 
           (expr.object as Variable).name === "msg";
  }

  protected handleDefault(expr: Member): EmitResult {
    switch (expr.property) {
      case "sender":
        return { 
          setupLines: [], 
          valueExpr: "Msg.sender()" 
        };
      case "value":
        return { 
          setupLines: [], 
          valueExpr: "Msg.value()" 
        };
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported msg property: ${expr.property} */`
        };
    }
  }
}

