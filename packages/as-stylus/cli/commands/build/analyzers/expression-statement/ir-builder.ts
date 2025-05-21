import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { toIRExpr } from "../helpers.js";
import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ExpressionStatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: ExpressionStatement;

  constructor(statement: ExpressionStatement, errorManager: ErrorManager) {
    super(errorManager);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ExpressionStatementSyntaxValidator(
      this.statement,
      this.errorManager,
    );
    return syntaxValidator.validate();
  }

  build(): IRStatement {
    const expr = this.statement.getExpression();

    // Handle assignment expressions (x = y)
    if (expr.getKind() === SyntaxKind.BinaryExpression) {
      const bin = expr as BinaryExpression;
      if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        const lhsNode = bin.getLeft();
        const rhsNode = bin.getRight();

        // Only treat as assignment if the LHS is an identifier
        if (lhsNode.getKind() === SyntaxKind.Identifier) {
          const lhsId = lhsNode as Identifier;
          return {
            kind: "assign",
            target: lhsId.getText(),
            expr: toIRExpr(rhsNode),
          };
        }
      }
    }

    // Handle simple expressions (function calls, etc.)
    return {
      kind: "expr",
      expr: toIRExpr(expr),
    };
  }
}
