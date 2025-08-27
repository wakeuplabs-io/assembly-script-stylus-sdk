import { Return, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";

/**
 * Handler for return statements
 */
export class ReturnHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "return";
  }

  private buildReturnWithSetup(setupLines: string[], returnExpr: string, indent: string): string {
    if (setupLines.length === 0) {
      return `${indent}return ${returnExpr};`;
    }
    
    const lines = setupLines.map(line => `${indent}${line}`);
    lines.push(`${indent}return ${returnExpr};`);
    return lines.join("\n");
  }

  handle(stmt: IRStatement, indent: string): string {
    const returnStmt = stmt as Return;
    
    if (!returnStmt.expr) {
      return `${indent}return;`;
    }

    const exprResult = this.contractContext.emitExpression(returnStmt.expr);

    if (returnStmt.expr.kind === "call") {
      return this.buildReturnWithSetup(exprResult.setupLines, exprResult.valueExpr, indent);
    }

    return this.buildReturnWithSetup(exprResult.setupLines, exprResult.valueExpr, indent);
  }
}