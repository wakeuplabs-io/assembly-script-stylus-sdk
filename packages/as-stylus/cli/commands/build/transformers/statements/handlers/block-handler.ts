import { Block, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { StatementHandler as MainStatementHandler } from "../statement-handler.js";

/**
 * Handler for block statements
 */
export class BlockHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "block";
  }

  handle(stmt: IRStatement, indent: string): string {
    const blockStmt = stmt as Block;
    const mainHandler = new MainStatementHandler(this.contractContext);

    const lines: string[] = [];
    lines.push(`${indent}{`);
    
    // Process each statement in the block
    const bodyLines = blockStmt.body
      .map(s => mainHandler.handle(s, indent + "  "))
      .filter(s => s.trim());
    
    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }
    
    lines.push(`${indent}}`);

    return lines.join("\n");
  }
}