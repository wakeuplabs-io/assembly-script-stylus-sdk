import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";


export class BooleanCopyHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "call" && 
      expr.target === "boolean.copy" &&
      expr.args.length === 1
    );
  }

  handle(expr: Call): EmitResult {
    const srcArg = this.contractContext.emit(expr.args[0]);
    const dstPtr = makeTemp("boolCopy");

    // Use create for direct boolean values (from function parameters)
    // Use copyNew for pointer-based booleans (from memory/storage)
    // Cast usize to u8 since entrypoint passes everything as usize
    const copyMethod = "Boolean.create";

    return {
      setupLines: [
        ...srcArg.setupLines,
        `const ${dstPtr}: usize = ${copyMethod}(${srcArg.valueExpr});`
      ],
      valueExpr: dstPtr,
      valueType: "boolean",
    };
  }
} 