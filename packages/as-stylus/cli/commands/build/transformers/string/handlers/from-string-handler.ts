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
    if (
      callExpression.args.length !== 1 ||
      !["literal", "var"].includes(callExpression.args[0].kind)
    ) {
      return false;
    }

    // Legacy format
    if (callExpression.target === "StrFactory.fromString") return true;

    // New receiver-based format
    if (callExpression.target === "fromString" && callExpression.receiver) {
      return (
        callExpression.receiver.kind === "var" && callExpression.receiver.name === "StrFactory"
      );
    }

    return false;
  }

  handle(expr: Call): EmitResult {
    const arg = expr.args[0];
    const argIR = this.contractContext.emitExpression(arg);
    const setup = [...argIR.setupLines];

    const resultStr = makeTemp("strObj");

    if (arg.kind === "literal") {
      setup.push(`const ${resultStr}: usize = Str.fromString("${arg.value}");`);
    } else {
      setup.push(`const ${resultStr}: usize = ${argIR.valueExpr};`);
    }

    return {
      setupLines: setup,
      valueExpr: resultStr,
      valueType: "Str",
    };
  }
}
