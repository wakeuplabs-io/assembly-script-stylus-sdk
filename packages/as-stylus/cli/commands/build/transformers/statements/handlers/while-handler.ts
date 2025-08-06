import { While, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { StatementHandler as MainStatementHandler } from "../statement-handler.js";

/**
 * Handler for while loop statements
 */
export class WhileHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "while";
  }

  handle(stmt: IRStatement, indent: string): string {
    const whileStmt = stmt as While;
    const mainHandler = new MainStatementHandler(this.contractContext);
    const lines: string[] = [];
   
    // Handle condition
    const condResult = this.contractContext.emitExpression(whileStmt.condition);
    if (condResult.setupLines && condResult.setupLines.length > 0) {
      lines.push(...condResult.setupLines.map(line => `${indent}${line}`));
    }
    
    lines.push(`${indent}while (${condResult.valueExpr}) {`);
    
    // Generate body
    const bodyLines = whileStmt.body
      .map(s => mainHandler.handle(s, indent + "  "))
      .filter(s => s.trim());
    
    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }
    
    lines.push(`${indent}}`);
    
    return lines.join("\n");
  }
}