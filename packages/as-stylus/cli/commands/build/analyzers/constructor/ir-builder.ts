import { Block, ConstructorDeclaration } from "ts-morph";

import { IRConstructor } from "@/cli/types/ir.types.js";

import { ConstructorSemanticValidator } from "./semantic-validator.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class ConstructorIRBuilder extends IRBuilder<IRConstructor> {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration) {
    super(constructorDecl);
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    const semanticValidator = new ConstructorSemanticValidator(this.constructorDecl);
    return semanticValidator.validate();
  }

  buildIR(): IRConstructor {

    const inputs = this.constructorDecl.getParameters().map((param) => {
      const argumentBuilder = new ArgumentIRBuilder(param);
      return argumentBuilder.validateAndBuildIR();
    });
    const body = this.constructorDecl.getBodyOrThrow() as Block;

    // Convert each statement using StatementIRBuilder
    const irBody = body.getStatements().map((stmt) => {
      const statementBuilder = new StatementIRBuilder(stmt);
      return statementBuilder.validateAndBuildIR();
    });
    return {
      inputs,
      ir: irBody,
    };
  }
}
