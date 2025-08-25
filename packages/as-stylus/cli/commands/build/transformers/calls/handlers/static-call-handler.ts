import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/base-abstract-handlers.js";
import { ContractContext } from "../../core/contract-context.js";

export class StaticCallHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target === "CallFactory.staticCall";
  }

  handle(expr: IRExpression): EmitResult {
    
    if (expr.kind !== "call") {
      return {
        setupLines: [],
        valueExpr: "/* Error: Not a call expression */",
        valueType: "usize"
      };
    }

    const args = expr.args || [];
    if (args.length < 2) {
      return {
        setupLines: [],
        valueExpr: "/* Error: CallFactory.staticCall requires at least 2 arguments: to, data */",
        valueType: "usize"
      };
    }

    
    const argResults = args.map((arg: IRExpression) => this.contractContext.emitExpression(arg));
    const [toResult, dataResult] = argResults;
    
    
    const setupLines = argResults.flatMap((result: EmitResult) => result.setupLines);

    // For data (Str), we need to get both pointer and length
    const dataPtr = dataResult.valueExpr;
    const dataLen = `Str.length(${dataPtr})`;

    // Handle optional gasLimit (3rd argument)
    const gasLimitExpr = args.length > 2 
      ? `${argResults[2].valueExpr}.toU64()` 
      : "500000"; // Default gas limit

    
    const callExpr = `Calls.staticCall(${toResult.valueExpr}, ${dataPtr}, ${dataLen}, ${gasLimitExpr})`;

    return {
      setupLines,
      valueExpr: callExpr,
      valueType: "usize"
    };
  }
}