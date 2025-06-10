import {
  ExpressionStatement,
  SyntaxKind,
  BinaryExpression,
  Identifier,
  SymbolFlags,
} from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_LHS: "Left-hand side of assignment must be an identifier",
  CONST_ASSIGNMENT: "Cannot assign to a constant variable",
} as const;

export class ExpressionStatementSyntaxValidator extends BaseValidator {
  private statement: ExpressionStatement;

  constructor(statement: ExpressionStatement, errorManager: ErrorManager) {
    super(errorManager, statement.getSourceFile().getFilePath(), statement.getStartLineNumber());
    this.statement = statement;
  }

  validate(): boolean {
    const expr = this.statement.getExpression();
    let hasError = false;

    // Handle assignment expressions (x = y)
    if (expr.getKind() === SyntaxKind.BinaryExpression) {
      const bin = expr as BinaryExpression;
      if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        const lhsNode = bin.getLeft();

        // Validate that the identifier is not a constant
        const lhsId = lhsNode as Identifier;
        const symbol = lhsId.getSymbol();
        if (symbol && symbol.getFlags() & SymbolFlags.ConstEnum) {
          this.addSyntaxError(ERROR_MESSAGES.CONST_ASSIGNMENT);
          hasError = true;
        }
      }
    }

    return !hasError;
  }
}
