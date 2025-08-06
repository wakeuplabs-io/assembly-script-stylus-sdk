import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";


export class StrFromStringHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(callExpression: Call): boolean {
    return callExpression.target === "StrFactory.fromString" && callExpression.args.length === 1 && ["literal", "var"].includes(callExpression.args[0].kind);
  } 

  handle(expr: Call): EmitResult {
    const arg = expr.args[0];
    const argIR = this.contractContext.emit(arg);
    const setup = [...argIR.setupLines];

     const resultStr = makeTemp("strObj");

    if (arg.kind === "literal") {
      setup.push(`const ${resultStr}: usize = Str.fromString("${arg.value}");`);
    }else {
      setup.push(`const ${resultStr}: usize = ${argIR.valueExpr};`);
    }

    return {
      setupLines: setup,
      valueExpr: resultStr,
      valueType: "Str",
    };
  }

}
