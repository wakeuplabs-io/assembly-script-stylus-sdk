import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { Handler } from "@/transformers/core/interfaces.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";


export class BooleanCopyHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    return expr.target === "boolean.copy";
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