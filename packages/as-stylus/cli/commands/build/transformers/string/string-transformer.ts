import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { StrCreateHandler } from "./handlers/create-handler.js";
import { StrEqualsHandler } from "./handlers/equals-handler.js";
import { StrFromStringHandler } from "./handlers/from-string-handler.js";
import { StrLengthHandler } from "./handlers/length-handler.js";
import { StrSliceHandler } from "./handlers/slice-handler.js";
import { StrToStringHandler } from "./handlers/to-string-handler.js";


export class StrTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Str");

    this.registerHandler(new StrCreateHandler(contractContext));
    this.registerHandler(new StrFromStringHandler(contractContext));
    this.registerHandler(new StrToStringHandler(contractContext));
    this.registerHandler(new StrSliceHandler(contractContext));
    this.registerHandler(new StrLengthHandler(contractContext));
    this.registerHandler(new StrEqualsHandler(contractContext));
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr || expr.kind !== "call") return false;
    const target = expr.target || "";

    if (target.endsWith(".equals")) {
      const arg = expr.args[0];
      if (arg.type === AbiType.String) {
        return true;
      }
    }

    if (expr.returnType !== AbiType.String && expr.type !== AbiType.String) {
      return false;
    }

    return (
      target === "strFactory.create" ||
      target === "StrFactory.fromString" ||
      target.endsWith(".toString") ||
      target.endsWith(".slice")
    );
  }

  protected handleDefault(
    expr: IRExpression,
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Unsupported Str expression: ${expr.kind} */`,
      valueType: "Str"
    };
  }

}
