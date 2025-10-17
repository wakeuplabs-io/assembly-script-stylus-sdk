import { Statement, SyntaxKind } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { DoWhileIRBuilder } from "../do-while/ir-builder.js";
import { ExpressionStatementIRBuilder } from "../expression-statement/ir-builder.js";
import { ForIRBuilder } from "../for/ir-builder.js";
import { IfIRBuilder } from "../if/ir-builder.js";
import { ReturnIRBuilder } from "../return/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { VariableDeclarationIRBuilder } from "../variable-declaration/ir-builder.js";
import { WhileIRBuilder } from "../while/ir-builder.js";

export class StatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: Statement;
  private isConstant: boolean;

  constructor(statement: Statement, isConstant: boolean = false) {
    super(statement);
    this.statement = statement;
    this.isConstant = isConstant;
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
        const variableBuilder = new VariableDeclarationIRBuilder(decl, this.isConstant);
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
       * For statement for loop execution
       * Example: "for (let i = 0; i < 10; i++) { increment(); }"
       */
      case SyntaxKind.ForStatement:
        return new ForIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.ForStatement),
        ).validateAndBuildIR();

      /**
       * Do-while statement for loop execution
       * Example: "do { increment(); } while (counter < 10);"
       */
      case SyntaxKind.DoStatement:
        return new DoWhileIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.DoStatement),
        ).validateAndBuildIR();

      /**
       * While statement for loop execution
       * Example: "while (counter < 10) { increment(); }"
       */
      case SyntaxKind.WhileStatement:
        return new WhileIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.WhileStatement),
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
