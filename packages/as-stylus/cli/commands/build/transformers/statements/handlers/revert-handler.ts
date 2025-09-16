import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRRevert, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";

/**
 * Handler for revert statements
 */
export class RevertHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "revert";
  }

  handle(stmt: IRStatement, indent: string): string {
    const revertStmt = stmt as IRRevert;

    // Create a call expression for the revert
    const revertExpression: IRExpression = {
      kind: "call",
      target: `${revertStmt.error}.revert`,
      args: revertStmt.args,
      type: AbiType.Function,
      returnType: AbiType.Void,
      scope: "memory",
    };

    const result = this.contractContext.emitExpression(revertExpression);

    if (result.setupLines && result.setupLines.length > 0) {
      return result.setupLines.map((line) => `${indent}${line}`).join("\n");
    }

    return `${indent}${result.valueExpr};`;
  }
}
