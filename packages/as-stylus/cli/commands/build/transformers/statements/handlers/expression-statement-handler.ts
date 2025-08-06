import { ExpressionStatement, IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionHandler } from "../../expressions/expression-handler.js";
import { StatementHandler } from "../base-statement-handler.js";

/**
 * Handler for expression statements
 * These are expressions that appear as standalone statements
 */
export class ExpressionStatementHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "expr";
  }

  handle(stmt: IRStatement, indent: string): string {
    const exprStmt = stmt as ExpressionStatement;
    const exprHandler = new ExpressionHandler(this.contractContext);
    const exprResult = exprHandler.handle(exprStmt.expr);

    // Handle cases where the expression returns statement lines
    if (exprResult.statementLines?.length) {
      return exprResult.statementLines.map((l) => `${indent}${l}`).join("\n");
    }

    // Handle setup lines
    if (exprResult.setupLines.length) {
      const lines = exprResult.setupLines.map((l) => `${indent}${l}`);
      
      // Only add the value expression if it's not empty or a comment
      if (exprResult.valueExpr.trim() !== "" && !exprResult.valueExpr.trim().startsWith("/*")) {
        lines.push(`${indent}${exprResult.valueExpr};`);
      }
      
      return lines.join("\n");
    }

    // Simple case - just the expression with semicolon
    return exprResult.valueExpr.trim() !== "" ? 
      `${indent}${exprResult.valueExpr};` : 
      "";
  }
}