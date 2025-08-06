import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/base-abstract-handlers.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class U256CopyHandler extends Handler {
  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "call" && 
      expr.target === "U256.copy" &&
      expr.args.length === 1
    );
  }

  handle(expr: Call): EmitResult {
    const srcArg = this.contractContext.emit(expr.args[0]);
    const dstPtr = makeTemp("u256Copy");

    return {
      setupLines: [
        ...srcArg.setupLines,
        `const ${dstPtr}: usize = U256.copyNew(${srcArg.valueExpr});`
      ],
      valueExpr: dstPtr,
      valueType: "U256",
    };
  }
} 