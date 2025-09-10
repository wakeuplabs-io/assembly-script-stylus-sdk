import { AbiType } from "@/cli/types/abi.types.js";
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
    let exprResult = this.contractContext.emitExpression(assignment.expr);
    const lines: string[] = [];

    if (exprResult.setupLines.length > 0) {
      lines.push(...exprResult.setupLines.map((line) => `${indent}${line}`));
    }

    if (assignment.scope === "storage" && this.isBooleanAssignment(assignment, exprResult)) {
      exprResult = this.convertBooleanForStorage(exprResult);
    }

    if (assignment.target.indexOf(".") === -1) {
      lines.push(`${indent}${assignment.target} = ${exprResult.valueExpr};`);
    } else {
      const parts = assignment.target.split(".");
      const property = parts[0];
      lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
    }

    if (assignment.scope === "storage") {
      const property = assignment.target;
      lines.push(`${indent}store_${property}();`);
    }

    return combineLines(lines, "");
  }

  /**
   * Check if this assignment involves a boolean that needs storage conversion
   */
  private isBooleanAssignment(assignment: Assignment, exprResult: any): boolean {
    const isAssigningToBooleanStorage =
      assignment.target.includes("_storage") || assignment.target === "flag_storage";

    if (!isAssigningToBooleanStorage) {
      return false;
    }

    if (assignment.expr.kind === "literal" && typeof assignment.expr.value === "boolean") {
      return true;
    }

    if (exprResult.valueType === "boolean") {
      return true;
    }

    if (
      assignment.expr.kind === "var" &&
      (assignment.expr.type === AbiType.Bool ||
        assignment.expr.originalType === "bool" ||
        assignment.expr.originalType === "boolean")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Convert boolean primitive to Boolean.create() for storage
   */
  private convertBooleanForStorage(exprResult: any): any {
    if (exprResult.valueType === "usize" && exprResult.valueExpr.includes("Boolean.create")) {
      return exprResult;
    }

    if (exprResult.valueType === "boolean") {
      return {
        ...exprResult,
        valueExpr: `Boolean.create(${exprResult.valueExpr})`,
        valueType: "usize",
      };
    }

    return exprResult;
  }
}
