import { IfStatement, SyntaxKind, Statement as TSStatement } from "ts-morph";

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

  /**
   * Generic helper to process a block of statements
   * @param blockStatement - The statement that could be a block or single statement
   * @returns Array of IR statements
   */
  private processBlock<T extends TSStatement>(blockStatement: T): IRStatement[] {
    const block = blockStatement.asKind(SyntaxKind.Block);
    let statements: TSStatement[] = [];

    if (block) {
      statements = block.getStatements();
    } else {
      statements = [blockStatement];
    }

    return statements.map((stmt) => new StatementIRBuilder(stmt).validateAndBuildIR());
  }

  buildIR(): IRStatement {
    const cond = new ConditionExpressionIRBuilder(
      this.statement.getExpression(),
    ).validateAndBuildIR() as IRCondition;

    // Process then block using the generic helper
    const thenStatements = this.processBlock(this.statement.getThenStatement());

    // Process else block using the generic helper
    const elseNode = this.statement.getElseStatement();
    const elseStatements = elseNode ? this.processBlock(elseNode) : undefined;

    return {
      kind: "if",
      condition: cond,
      then: thenStatements,
      else: elseStatements,
    };
  }
}
