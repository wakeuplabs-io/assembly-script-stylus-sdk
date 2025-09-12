import { Assignment, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";
import { combineLines } from "../utils/combine-lines.js";

/**
 * Handler for assignment statements
 * Handles both local variable assignments and storage assignments
 */
export class AssignmentHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "assign";
  }

  handle(stmt: IRStatement, indent: string): string {
    const assignment = stmt as Assignment;
    const exprResult = this.contractContext.emitExpression(assignment.expr);
    const lines: string[] = [];


    if (exprResult.setupLines.length > 0) {
      lines.push(...exprResult.setupLines.map((line) => `${indent}${line}`));
    }

    if (assignment.target.indexOf(".") !== -1) {
      const parts = assignment.target.split(".");
      const property = parts[0];
      lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
    }

    if (assignment.scope === "storage") {
      const property = assignment.target;
      lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
    }

    return combineLines(lines, "");
  }
}
