import { Statement, SyntaxKind, VariableStatement } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionStatementIRBuilder } from "../expression-statement/ir-builder.js";
import { IfIRBuilder } from "../if/ir-builder.js";
import { ReturnIRBuilder } from "../return/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { VariableIRBuilder } from "../variable/ir-builder.js";

export class StatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: Statement;

  constructor(statement: Statement, errorManager: ErrorManager) {
    super(errorManager);
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
        const variableBuilder = new VariableIRBuilder(decl, this.errorManager);
        return variableBuilder.validateAndBuildIR();
      }

      /**
       * Return statement for returning values from functions
       * Examples: "return 0;", "return counter.toString();"
       */
      case SyntaxKind.ReturnStatement:
        return new ReturnIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.ReturnStatement),
          this.errorManager,
        ).validateAndBuildIR();

      /**
       * If statement for conditional execution
       * Example: "if (counter > 10) { reset(); } else { increment(); }"
       */
      case SyntaxKind.IfStatement:
        return new IfIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.IfStatement),
          this.errorManager,
        ).validateAndBuildIR();

      /**
       * Expression statement represents function calls, assignments, etc.
       * Examples: "increment();", "counter = counter + 1;"
       */
      case SyntaxKind.ExpressionStatement:
        return new ExpressionStatementIRBuilder(
          this.statement.asKindOrThrow(SyntaxKind.ExpressionStatement),
          this.errorManager,
        ).validateAndBuildIR();

      default:
        throw new Error(`Unsupported statement kind: ${this.statement.getKindName()}`);
    }
  }
}
