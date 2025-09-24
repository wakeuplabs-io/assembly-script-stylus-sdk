import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { Handler } from "../../core/base-abstract-handlers.js";
import { ContractContext } from "../../core/contract-context.js";

export class SendHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target === "CallFactory.send";
  }

  handle(expr: IRExpression): EmitResult {
    if (expr.kind !== "call") {
      return {
        setupLines: [],
        valueExpr: "/* Error: Not a call expression */",
        valueType: "bool",
      };
    }

    const args = expr.args || [];
    if (args.length < 2) {
      return {
        setupLines: [],
        valueExpr: "/* Error: CallFactory.send requires 2 arguments: to, value */",
        valueType: "bool",
      };
    }

    const argResults = args.map((arg: IRExpression) => this.contractContext.emitExpression(arg));
    const [toResult, valueResult] = argResults;

    const setupLines = argResults.flatMap((result: EmitResult) => result.setupLines);

    const callExpr = `Calls.send(${toResult.valueExpr}, ${valueResult.valueExpr})`;

    return {
      setupLines,
      valueExpr: callExpr,
      valueType: "boolean", // Returns ABI-encoded boolean (32 bytes)
    };
  }
}
