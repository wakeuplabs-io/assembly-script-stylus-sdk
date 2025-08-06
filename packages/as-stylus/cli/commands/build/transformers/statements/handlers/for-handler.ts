import { For, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { StatementHandler as MainStatementHandler } from "../statement-handler.js";

/**
 * Handler for for loop statements
 */
export class ForHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "for";
  }

  handle(stmt: IRStatement, indent: string): string {
    const forStmt = stmt as For;
    const mainHandler = new MainStatementHandler(this.contractContext);
    const lines: string[] = [];
    
    // Handle initialization
    let initCode = "";
    if (forStmt.init) {
      if (forStmt.init.kind === "let") {
        const initResult = this.contractContext.emitExpression(forStmt.init.expr);
        if (initResult.setupLines && initResult.setupLines.length > 0) {
          lines.push(...initResult.setupLines.map(line => `${indent}${line}`));
          initCode = `let ${forStmt.init.name} = ${initResult.valueExpr}`;
        } else {
          initCode = `let ${forStmt.init.name} = ${initResult.valueExpr}`;
        }
      } else {
        const initStatement = mainHandler.handle(forStmt.init, "");
        initCode = initStatement.trim();
      }
    }
   
    // Handle condition
    let conditionCode = "";
    if (forStmt.condition) {
      const condResult = this.contractContext.emitExpression(forStmt.condition);
      if (condResult.setupLines && condResult.setupLines.length > 0) {
        lines.push(...condResult.setupLines.map(line => `${indent}${line}`));
      }
      conditionCode = condResult.valueExpr;
    }
    
    // Handle update expression  
    let updateCode = "";
    if (forStmt.update) {
      const updateResult = this.contractContext.emitExpression(forStmt.update);
      updateCode = updateResult.valueExpr;
    }
    
    // Generate for statement
    lines.push(`${indent}for (${initCode}; ${conditionCode}; ${updateCode}) {`);
    
    // Generate body
    const bodyLines = forStmt.body
      .map(s => mainHandler.handle(s, indent + "  "))
      .filter(s => s.trim());
    
    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }
    
    lines.push(`${indent}}`);
    
    return lines.join("\n");
  }
}