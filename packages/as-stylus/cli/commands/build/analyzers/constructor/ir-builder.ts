import { Block, ConstructorDeclaration } from "ts-morph";
import { ConstructorSyntaxValidator } from "./syntax-validator";
import { IRBuilder } from "../shared/ir-builder";
import { IRConstructor } from "@/cli/types/ir.types";
import { ErrorManager } from "../shared/error-manager";
import { StatementIRBuilder } from "../statement/ir-builder";

export class ConstructorIRBuilder extends IRBuilder<IRConstructor> {
  private constructorDecl: ConstructorDeclaration;
  
  constructor(
    constructorDecl: ConstructorDeclaration,
    errorManager: ErrorManager,
  ) {
    super(errorManager);
    this.constructorDecl = constructorDecl;
  }
  
  validate(): boolean {
    const syntaxValidator = new ConstructorSyntaxValidator(this.constructorDecl, this.errorManager);
    return syntaxValidator.validate();
  }

  build(): IRConstructor {
    const inputs = this.constructorDecl.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));
    const body = this.constructorDecl.getBodyOrThrow() as Block;
    
    // Convert each statement using StatementIRBuilder
    const irBody = body.getStatements().map(stmt => {
      const statementBuilder = new StatementIRBuilder(stmt, this.errorManager);
      return statementBuilder.build();
    });
    
    return {
      inputs,
      ir: irBody
    };
  }
}
