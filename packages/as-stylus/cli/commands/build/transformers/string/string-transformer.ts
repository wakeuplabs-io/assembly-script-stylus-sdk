import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { MethodName } from "@/cli/types/method-types.js";

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

    if (target === "StrFactory.create" || target === "StrFactory.fromString") {
      return true;
    }

    if ((target === MethodName.Create || target === MethodName.FromString) && expr.receiver) {
      if (expr.receiver.kind === "var" && expr.receiver.name === "StrFactory") {
        return true;
      }
    }

    const stringBooleanMethods = [MethodName.Equals];
    if (stringBooleanMethods.some((method) => target.endsWith(`.${method}`))) {
      return true;
    }

    if (expr.returnType === AbiType.String || expr.type === AbiType.String) {
      const stringMethods = [MethodName.ToString, MethodName.Slice, MethodName.Length];
      if (stringMethods.some((method) => target.endsWith(`.${method}`))) {
        return true;
      }

      if (expr.receiver && stringMethods.includes(target as MethodName)) {
        return expr.receiver.type === AbiType.String;
      }
    }

    return false;
  }

  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Unsupported Str expression: ${expr.kind} */`,
      valueType: "Str",
    };
  }
}
