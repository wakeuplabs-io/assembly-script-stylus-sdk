import { IfStatement, SyntaxKind } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { BaseValidator } from "../shared/base-validator.js";

const ERROR_MESSAGES = {
  CONDITION_NOT_BOOLEAN: (conditionType: string) => `If condition must be a boolean expression, got ${conditionType}`,
  THEN_NOT_BLOCK: "Then clause must be a block statement",
  ELSE_NOT_BLOCK: "Else clause must be a block statement",
} as const;

export class IfSyntaxValidator extends BaseValidator {
  private statement: IfStatement;

  constructor(statement: IfStatement, errorManager: ErrorManager) {
    super(errorManager, statement.getSourceFile().getFilePath(), statement.getStartLineNumber());
    this.statement = statement;
  }

  validate(): boolean {
    let hasError = false;
    // Check if condition is a boolean expression
    const condition = this.statement.getExpression();
    const conditionType = condition.getType().getText();
    if (conditionType !== "boolean") {
      this.addSyntaxError(ERROR_MESSAGES.CONDITION_NOT_BOOLEAN(conditionType));
      hasError = true;
    }

    // Check if then block is a block statement
    const thenStmt = this.statement.getThenStatement();
    if (!thenStmt.isKind(SyntaxKind.Block)) {
      this.addSyntaxError(ERROR_MESSAGES.THEN_NOT_BLOCK);
      hasError = true;
    }

    // Check if else block is a block statement (if it exists)
    const elseStmt = this.statement.getElseStatement();
    if (elseStmt && !elseStmt.isKind(SyntaxKind.Block)) {
      this.addSyntaxError(ERROR_MESSAGES.ELSE_NOT_BLOCK);
      hasError = true;
    }

    return !hasError;
  }
}
