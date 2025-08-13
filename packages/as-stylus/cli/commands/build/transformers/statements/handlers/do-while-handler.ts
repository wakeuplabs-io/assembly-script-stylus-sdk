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

    const conditionResult = this.emitConditionWithSetup(doWhileStmt.condition, indent);

    if (conditionResult.setupLines.length > 0) {
      lines.push(...conditionResult.setupLines);
    }

    lines.push(`${indent}do {`);

    const bodyLines = doWhileStmt.body
      .map((s) => mainHandler.handle(s, indent + "  "))
      .filter((s) => s.trim());

    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }

    lines.push(`${indent}} while (${conditionResult.conditionExpr});`);

    return lines.join("\n");
  }
}
