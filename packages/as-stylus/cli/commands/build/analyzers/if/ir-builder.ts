import { IfStatement, SyntaxKind, Block } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { toIRExpr } from "../helpers.js";
import { IfSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class IfIRBuilder extends IRBuilder<IRStatement> {
  private statement: IfStatement;

  constructor(statement: IfStatement, errorManager: ErrorManager) {
    super(errorManager);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new IfSyntaxValidator(this.statement, this.errorManager);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
    const cond = toIRExpr(this.statement.getExpression());
    const thenBlock = this.statement.getThenStatement().asKindOrThrow(SyntaxKind.Block);
    const thenStmts = thenBlock
      .getStatements()
      .map((blockStatement) => new StatementIRBuilder(blockStatement, this.errorManager).validateAndBuildIR());

    const elseNode = this.statement.getElseStatement();
    const elseStmts = elseNode
      ? (elseNode.asKindOrThrow(SyntaxKind.Block) as Block)
          .getStatements()
          .map((blockStatement) =>
            new StatementIRBuilder(blockStatement, this.errorManager).validateAndBuildIR(),
          )
      : undefined;

    return {
      kind: "if",
      condition: cond,
      then: thenStmts,
      else: elseStmts,
    };
  }
}
