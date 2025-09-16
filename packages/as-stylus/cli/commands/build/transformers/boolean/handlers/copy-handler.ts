import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class BooleanCopyHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target === "boolean.copy";
  }

  handle(expr: Call): EmitResult {
    const srcArg = this.contractContext.emitExpression(expr.args[0]);
    const dstPtr = makeTemp("boolCopy");

    return {
      setupLines: [...srcArg.setupLines, `const ${dstPtr}: boolean = ${srcArg.valueExpr};`],
      valueExpr: dstPtr,
      valueType: "boolean",
    };
  }
}
