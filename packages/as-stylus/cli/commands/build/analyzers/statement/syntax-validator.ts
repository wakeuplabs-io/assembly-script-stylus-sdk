import { Statement, SyntaxKind } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class StatementSyntaxValidator extends BaseValidator {
  constructor(
    private statement: Statement,
    errorManager: ErrorManager,
  ) {
    super(errorManager);
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
        this.errorManager.addSyntaxError(
          `Unsupported statement kind: ${this.statement.getKindName()}`,
          this.statement.getSourceFile().getFilePath(),
          this.statement.getEndLineNumber(),
        );
        return false;
    }
  }
}
