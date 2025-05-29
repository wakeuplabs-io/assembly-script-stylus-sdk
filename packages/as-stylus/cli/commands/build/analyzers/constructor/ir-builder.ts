import { Block, ConstructorDeclaration } from "ts-morph";

import { IRConstructor } from "@/cli/types/ir.types.js";

import { ConstructorSemanticValidator } from "./semantic-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class ConstructorIRBuilder extends IRBuilder<IRConstructor> {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    const semanticValidator = new ConstructorSemanticValidator(this.constructorDecl, this.errorManager);
    return semanticValidator.validate();
  }

  buildIR(): IRConstructor {
    // TODO: Implement parameters IR builder
    const inputs = this.constructorDecl.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));
    const body = this.constructorDecl.getBodyOrThrow() as Block;

    // Convert each statement using StatementIRBuilder
    const irBody = body.getStatements().map((stmt) => {
      const statementBuilder = new StatementIRBuilder(stmt, this.errorManager);
      return statementBuilder.validateAndBuildIR();
    });

    return {
      inputs,
      ir: irBody,
    };
  }
}
