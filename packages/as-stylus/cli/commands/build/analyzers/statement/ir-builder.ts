import { Statement, SyntaxKind } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionStatementIRBuilder } from "../expression-statement/ir-builder.js";
import { IfIRBuilder } from "../if/ir-builder.js";
import { ReturnIRBuilder } from "../return/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { VariableDeclarationIRBuilder } from "../variable-declaration/ir-builder.js";

export class StatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: Statement;

  constructor(statement: Statement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRStatement {
    switch (this.statement.getKind()) {
      /**
       * Variable declaration statement
       * Example: "let counter = 0;", "const value = u256.create();"
       */
      case SyntaxKind.VariableStatement: {
        const decl = this.statement
          .asKindOrThrow(SyntaxKind.VariableStatement)
          .getDeclarations()[0];
        const variableBuilder = new VariableDeclarationIRBuilder(decl);
        return variableBuilder.validateAndBuildIR();
      }

      /**
       * Return statement for returning values from functions
       * Examples: "return 0;", "return counter.toString();"
       */
      case SyntaxKind.ReturnStatement:
        return new ReturnIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.ReturnStatement),
        ).validateAndBuildIR();

      /**
       * If statement for conditional execution
       * Example: "if (counter > 10) { reset(); } else { increment(); }"
       */
      case SyntaxKind.IfStatement:
        return new IfIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.IfStatement),
        ).validateAndBuildIR();

      /**
       * Expression statement represents function calls, assignments, etc.
       * Examples: "increment();", "counter = counter + 1;"
       */
      case SyntaxKind.ExpressionStatement:
        return new ExpressionStatementIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.ExpressionStatement),
        ).validateAndBuildIR();

      default:
        throw new Error(`Unsupported statement kind: ${this.statement.getKindName()}`);
    }
  }
}
