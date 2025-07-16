import { ForStatement, SyntaxKind, Statement as TSStatement } from "ts-morph";

import { IRStatement, For, IRCondition, IRExpression } from "@/cli/types/ir.types.js";

import { ConditionExpressionIRBuilder } from "../condition/ir-builder.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";
import { VariableDeclarationIRBuilder } from "../variable-declaration/ir-builder.js";

export class ForIRBuilder extends IRBuilder<IRStatement> {
  private statement: ForStatement;

  constructor(statement: ForStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    // TODO: Implement ForStatement validation
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
    const initializer = this.statement.getInitializer();
    let initIR: IRStatement | undefined;
    if (initializer) {
      if (initializer.getKind() === SyntaxKind.VariableDeclarationList) {
        const varDecl = (initializer as any).getDeclarations()[0];
        const variableBuilder = new VariableDeclarationIRBuilder(varDecl);
        initIR = variableBuilder.validateAndBuildIR();
      } else {
        initIR = {
          kind: "expr",
          expr: new ExpressionIRBuilder(initializer as any).validateAndBuildIR()
        } as IRStatement;
      }
    }

    const condition = this.statement.getCondition();
    let conditionIR: IRCondition | IRExpression | undefined;
    if (condition) {
      try {
        conditionIR = new ConditionExpressionIRBuilder(condition).validateAndBuildIR() as IRCondition;
      } catch {
        conditionIR = new ExpressionIRBuilder(condition).validateAndBuildIR() as IRExpression;
      }
    }

    const incrementor = this.statement.getIncrementor();
    let updateIR: IRExpression | undefined;
    if (incrementor) {
      updateIR = new ExpressionIRBuilder(incrementor).validateAndBuildIR() as IRExpression;
    }

    const bodyStatements = this.processBlock(this.statement.getStatement());

    const forIR: For = {
      kind: "for",
      init: initIR,
      condition: conditionIR,
      update: updateIR,
      body: bodyStatements,
    };

    return forIR;
  }
} 