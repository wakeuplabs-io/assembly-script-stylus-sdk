import { EmitResult } from "@/cli/types/emit.types.js";
import { Member, Variable } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";



export class MsgTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Msg");
  }

  canHandle(expr: Member): boolean {
    const object = expr.object as Variable;
    return object?.name === "msg";
  }

  protected handleDefault(expr: Member): EmitResult {
    switch (expr.property) {
      case "sender":
        return {
          setupLines: [],
          valueExpr: "Msg.sender()",
          valueType: "Address"
        };
      case "value":
        return {
          setupLines: [],
          valueExpr: "Msg.value()",
          valueType: "U256"
        };
      case "data":
        return {
          setupLines: [],
          valueExpr: "Msg.data()",
          valueType: "bytes"
        };
      case "sig":
        return {
          setupLines: [],
          valueExpr: "Msg.sig()",
          valueType: "bytes4"
        };
      case "reentrant":
        return {
          setupLines: [],
          valueExpr: "Msg.reentrant()",
          valueType: "U256"
        };
      case "hasValue":
        return {
          setupLines: [],
          valueExpr: "Msg.hasValue()",
          valueType: "boolean"
        };
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported msg property: ${expr.property} */`,
          valueType: "unknown"
        };
    }
  }
}

