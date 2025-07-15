import { ForStatement, SyntaxKind, Statement as TSStatement } from "ts-morph";

import { IRStatement, For, IRCondition, IRExpression } from "@/cli/types/ir.types.js";

import { ConditionExpressionIRBuilder } from "../condition/ir-builder.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

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
    // Process initializer (optional)
    const initializer = this.statement.getInitializer();
    let initIR: IRStatement | undefined;
    if (initializer) {
      // Handle VariableDeclarationList vs Expression
      if (initializer.getKind() === SyntaxKind.VariableDeclarationList) {
        // For variable declarations, create a variable statement
        const varDecl = (initializer as any).getDeclarations()[0];
        initIR = {
          kind: "let",
          name: varDecl.getName(),
          expr: varDecl.getInitializer() ? 
            new ExpressionIRBuilder(varDecl.getInitializer()).validateAndBuildIR() :
            { kind: "literal", value: null, type: "unknown" },
          scope: "memory",
          type: "unknown"
        } as IRStatement;
      } else {
        // For expressions, wrap in expression statement
        initIR = {
          kind: "expr",
          expr: new ExpressionIRBuilder(initializer as any).validateAndBuildIR()
        } as IRStatement;
      }
    }

    // Process condition (optional)
    const condition = this.statement.getCondition();
    let conditionIR: IRCondition | IRExpression | undefined;
    if (condition) {
      // Try to build as condition first, fall back to expression
      try {
        conditionIR = new ConditionExpressionIRBuilder(condition).validateAndBuildIR() as IRCondition;
      } catch {
        conditionIR = new ExpressionIRBuilder(condition).validateAndBuildIR() as IRExpression;
      }
    }

    // Process incrementor (optional)
    const incrementor = this.statement.getIncrementor();
    let updateIR: IRExpression | undefined;
    if (incrementor) {
      updateIR = new ExpressionIRBuilder(incrementor).validateAndBuildIR() as IRExpression;
    }

    // Process body
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