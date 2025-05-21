import { IfStatement, SyntaxKind } from "ts-morph";

import { ErrorManager } from "../shared/error-manager.js";

export class IfSyntaxValidator {
  private statement: IfStatement;
  private errorManager: ErrorManager;
  private filePath: string;

  constructor(statement: IfStatement, errorManager: ErrorManager) {
    this.statement = statement;
    this.errorManager = errorManager;
    this.filePath = statement.getSourceFile().getFilePath();
  }

  validate(): boolean {
    let hasError = false;
    // Check if condition is a boolean expression
    const condition = this.statement.getExpression();
    const conditionType = condition.getType().getText();
    if (conditionType !== "boolean") {
      this.errorManager.addSyntaxError(
        `If condition must be a boolean expression, got ${conditionType}`,
        this.filePath,
        this.statement.getStartLineNumber(),
      );
      hasError = true;
    }

    // Check if then block is a block statement
    const thenStmt = this.statement.getThenStatement();
    if (!thenStmt.isKind(SyntaxKind.Block)) {
      this.errorManager.addSyntaxError(
        "Then clause must be a block statement",
        this.filePath,
        thenStmt.getStartLineNumber(),
      );
      hasError = true;
    }

    // Check if else block is a block statement (if it exists)
    const elseStmt = this.statement.getElseStatement();
    if (elseStmt && !elseStmt.isKind(SyntaxKind.Block)) {
      this.errorManager.addSyntaxError(
        "Else clause must be a block statement",
        this.filePath,
        elseStmt.getStartLineNumber(),
      );
      hasError = true;
    }

    return !hasError;
  }
}
