import { WhileStatement, SyntaxKind, Statement as TSStatement } from "ts-morph";

import { IRStatement, While, IRCondition, IRExpression } from "@/cli/types/ir.types.js";

import { ConditionExpressionIRBuilder } from "../condition/ir-builder.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class WhileIRBuilder extends IRBuilder<IRStatement> {
  private statement: WhileStatement;

  constructor(statement: WhileStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    // TODO: Implement WhileStatement validation
    return true;
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

    return statements.map((stmt) => 
      new StatementIRBuilder(stmt).validateAndBuildIR()
    );
  }

  buildIR(): IRStatement {
    // Process condition (required)
    const condition = this.statement.getExpression();
    let conditionIR: IRCondition | IRExpression;
    
    // Try to build as condition first, fall back to expression
    try {
      conditionIR = new ConditionExpressionIRBuilder(condition).validateAndBuildIR() as IRCondition;
    } catch {
      conditionIR = new ExpressionIRBuilder(condition).validateAndBuildIR() as IRExpression;
    }

    // Process body
    const bodyStatements = this.processBlock(this.statement.getStatement());

    const whileIR: While = {
      kind: "while",
      condition: conditionIR,
      body: bodyStatements,
    };

    return whileIR;
  }
} 