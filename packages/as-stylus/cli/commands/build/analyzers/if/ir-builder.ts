import { IfStatement, SyntaxKind, Block } from "ts-morph";

import { IRCondition, IRStatement } from "@/cli/types/ir.types.js";

import { IfSyntaxValidator } from "./syntax-validator.js";
import { ConditionExpressionIRBuilder } from "../condition/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";  

export class IfIRBuilder extends IRBuilder<IRStatement> {
  private statement: IfStatement;

  constructor(statement: IfStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new IfSyntaxValidator(this.statement);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
    const cond = new ConditionExpressionIRBuilder(this.statement.getExpression()).validateAndBuildIR() as IRCondition;
    const thenBlock = this.statement.getThenStatement().asKind(SyntaxKind.Block);
    let thenStatements = thenBlock?.getStatements() ?? [];
    if (!thenBlock) {
      thenStatements = [this.statement.getThenStatement()];
    }

    const thenStmts = thenStatements.map((blockStatement) => new StatementIRBuilder(blockStatement as Block).validateAndBuildIR());

    const elseNode = this.statement.getElseStatement();
    const elseStmts = elseNode
      ? (elseNode.asKindOrThrow(SyntaxKind.Block) as Block)
          .getStatements()
          .map((blockStatement) =>
            new StatementIRBuilder(blockStatement as Block).validateAndBuildIR(),
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
