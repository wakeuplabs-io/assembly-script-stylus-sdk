import { IfStatement, Statement, SyntaxKind } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";

// TODO: move to shared/error-messages.ts
const ERROR_MESSAGES = {
  CONDITION_NOT_BOOLEAN: (conditionType: string) =>
    `If condition must be a boolean expression, got ${conditionType}`,
  THEN_INVALID: "Then clause must be either a block statement or a single statement",
  ELSE_INVALID: "Else clause must be either a block statement or a single statement",
} as const;

const VALID_CONDITION_TYPES = ["boolean", "true", "false"];

export class IfSyntaxValidator extends BaseValidator {
  private statement: IfStatement;

  constructor(statement: IfStatement) {
    super(statement);
    this.statement = statement;
  }

  private isValidStatement(statement: Statement): boolean {
    return (
      statement.isKind(SyntaxKind.Block) ||
      statement.isKind(SyntaxKind.ExpressionStatement) ||
      statement.isKind(SyntaxKind.ReturnStatement) ||
      statement.isKind(SyntaxKind.VariableStatement)
    );
  }

  validate(): boolean {
    let hasError = false;
    // Check if condition is a boolean expression
    const condition = this.statement.getExpression();
    const conditionType = condition.getType().getText();
    if (!VALID_CONDITION_TYPES.includes(conditionType)) {
      this.addSyntaxError(ERROR_MESSAGES.CONDITION_NOT_BOOLEAN(conditionType));
      hasError = true;
    }

    // Check if then statement is valid (block or single statement)
    const thenStmt = this.statement.getThenStatement();
    if (!this.isValidStatement(thenStmt)) {
      this.addSyntaxError(ERROR_MESSAGES.THEN_INVALID);
      hasError = true;
    }

    // Check if else statement is valid (block or single statement), if it exists
    const elseStmt = this.statement.getElseStatement();
    if (elseStmt) {
      if (!this.isValidStatement(elseStmt)) {
        this.addSyntaxError(ERROR_MESSAGES.ELSE_INVALID);
        hasError = true;
      }
    }

    return !hasError;
  }
}
