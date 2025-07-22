import { Statement, SyntaxKind } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";

const ERROR_MESSAGES = {
  UNSUPPORTED_STATEMENT_KIND: (kind: string) => `Unsupported statement kind: ${kind}`,
} as const;

export class StatementSyntaxValidator extends BaseValidator {
  constructor(private statement: Statement) {
    super(statement);
  }

  validate(): boolean {
    const kind = this.statement.getKind();

    // Check if the statement kind is supported
    switch (kind) {
      case SyntaxKind.VariableStatement:
      case SyntaxKind.ExpressionStatement:
      case SyntaxKind.ReturnStatement:
      case SyntaxKind.IfStatement:
        return true;

      default:
        this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_STATEMENT_KIND(this.statement.getKindName()));
        return false;
    }
  }
}
