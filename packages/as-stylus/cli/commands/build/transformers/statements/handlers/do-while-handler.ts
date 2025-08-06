import { DoWhile, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { StatementHandler as MainStatementHandler } from "../statement-handler.js";

/**
 * Handler for do-while loop statements
 */
export class DoWhileHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "do_while";
  }

  handle(stmt: IRStatement, indent: string): string {
    const doWhileStmt = stmt as DoWhile;
    const mainHandler = new MainStatementHandler(this.contractContext);
    const lines: string[] = [];
   
    lines.push(`${indent}do {`);
    
    // Generate body
    const bodyLines = doWhileStmt.body
      .map(s => mainHandler.handle(s, indent + "  "))
      .filter(s => s.trim());
    
    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }
    
    // Handle condition
    const condResult = this.contractContext.emitExpression(doWhileStmt.condition);
    lines.push(`${indent}} while (${condResult.valueExpr});`);
    
    return lines.join("\n");
  }
}