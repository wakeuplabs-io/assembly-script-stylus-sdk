import { Block, ConstructorDeclaration } from "ts-morph";

import { IRConstructor } from "@/cli/types/ir.types.js";

import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";
import { ConstructorSemanticValidator } from "./semantic-validator.js";

export class ConstructorIRBuilder extends IRBuilder<IRConstructor> {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    const syntaxValidator = new ConstructorSemanticValidator(this.constructorDecl, this.errorManager);
    return syntaxValidator.validate();
  }

  buildIR(): IRConstructor {
    const inputs = this.constructorDecl.getParameters().map((param) => {
      const argumentBuilder = new ArgumentIRBuilder(param, this.errorManager);
      return argumentBuilder.validateAndBuildIR();
    });
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
