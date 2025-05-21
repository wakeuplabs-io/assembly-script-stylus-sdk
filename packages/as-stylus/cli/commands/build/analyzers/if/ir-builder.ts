import { IfStatement, SyntaxKind, Block } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder";
import { ErrorManager } from "../shared/error-manager";
import { IRStatement } from "@/cli/types/ir.types";
import { toIRExpr } from "../helpers";
import { IfSyntaxValidator } from "./syntax-validator";
import { StatementIRBuilder } from "../statement/ir-builder";
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

  build(): IRStatement {
    const cond = toIRExpr(this.statement.getExpression());
    const thenBlock = this.statement.getThenStatement().asKindOrThrow(SyntaxKind.Block);
    const thenStmts = thenBlock.getStatements().map(blockStatement => (
      new StatementIRBuilder(blockStatement, this.errorManager).build()
    ));
    
    const elseNode = this.statement.getElseStatement();
    const elseStmts = elseNode
      ? (elseNode.asKindOrThrow(SyntaxKind.Block) as Block).getStatements().map(
        blockStatement => new StatementIRBuilder(blockStatement, this.errorManager).build()
      )
      : undefined;

    return { 
      kind: "if", 
      condition: cond, 
      then: thenStmts, 
      else: elseStmts 
    };
  }
} 