import { If, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { StatementHandler as MainStatementHandler } from "../statement-handler.js";

/**
 * Handler for if statements
 */
export class IfHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "if";
  }

  handle(stmt: IRStatement, indent: string): string {
    const ifStmt = stmt as If;
    const condResult = this.contractContext.emitExpression(ifStmt.condition);
    const mainHandler = new MainStatementHandler(this.contractContext);

    let lines: string[] = [];
    
    // Add condition setup lines if any
    if (condResult.setupLines.length > 0) {
      lines = [...condResult.setupLines.map((line) => `${indent}${line}`)];
    }

    // Add if statement
    lines.push(`${indent}if (${condResult.valueExpr}) {`);
    
    // Add then body
    const thenBody = ifStmt.then
      .map(s => mainHandler.handle(s, indent + "  "))
      .filter(s => s.trim())
      .join("\n");
    
    if (thenBody) {
      lines.push(thenBody);
    }
    
    lines.push(`${indent}}`);

    // Add else block if present
    if (ifStmt.else && ifStmt.else.length > 0) {
      lines[lines.length - 1] += " else {";
      
      const elseBody = ifStmt.else
        .map(s => mainHandler.handle(s, indent + "  "))
        .filter(s => s.trim())
        .join("\n");
      
      if (elseBody) {
        lines.push(elseBody);
      }
      
      lines.push(`${indent}}`);
    }

    return lines.join("\n");
  }
}