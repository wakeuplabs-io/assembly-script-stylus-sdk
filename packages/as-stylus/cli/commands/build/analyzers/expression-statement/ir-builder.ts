import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

// TODO: rename to AssignmentIRBuilder. Merge with VariableIRBuilder.
export class ExpressionStatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: ExpressionStatement;

  constructor(statement: ExpressionStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ExpressionStatementSyntaxValidator(this.statement);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
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
            expr: new ExpressionIRBuilder(rhsNode).validateAndBuildIR(),
          };
        }
      }
    }

    // Handle simple expressions (function calls, etc.)
    return {
      kind: "expr",
      expr: new ExpressionIRBuilder(expr).validateAndBuildIR(),
    };
  }
}
