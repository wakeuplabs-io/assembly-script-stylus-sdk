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

    let initCode = "";
    if (forStmt.init) {
      if (forStmt.init.kind === "let") {
        const initResult = this.emitConditionWithSetup(forStmt.init.expr, indent);
        if (initResult.setupLines.length > 0) {
          lines.push(...initResult.setupLines);
        }
        initCode = `let ${forStmt.init.name} = ${initResult.conditionExpr}`;
      } else {
        const initStatement = mainHandler.handle(forStmt.init, "");
        initCode = initStatement.trim();
      }
    }

    let conditionCode = "";
    if (forStmt.condition) {
      const conditionResult = this.emitConditionWithSetup(forStmt.condition, indent);
      if (conditionResult.setupLines.length > 0) {
        lines.push(...conditionResult.setupLines);
      }
      conditionCode = conditionResult.conditionExpr;
    }

    let updateCode = "";
    if (forStmt.update) {
      const updateResult = this.emitConditionWithSetup(forStmt.update, indent);
      if (updateResult.setupLines.length > 0) {
        lines.push(...updateResult.setupLines);
      }
      updateCode = updateResult.conditionExpr;
    }

    lines.push(`${indent}for (${initCode}; ${conditionCode}; ${updateCode}) {`);

    const bodyLines = forStmt.body
      .map((s) => mainHandler.handle(s, indent + "  "))
      .filter((s) => s.trim());

    if (bodyLines.length > 0) {
      lines.push(...bodyLines);
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }
}
