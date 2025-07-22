import { Block, ConstructorDeclaration } from "ts-morph";

import { StateMutability, Visibility } from "@/cli/types/abi.types.js";
import { IRMethod } from "@/cli/types/ir.types.js";

import { ConstructorSemanticValidator } from "./semantic-validator.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class ConstructorIRBuilder extends IRBuilder<IRMethod> {
  private constructorDecl: ConstructorDeclaration;
  private contractName: string;

  constructor(constructorDecl: ConstructorDeclaration, contractName: string) {
    super(constructorDecl);
    this.constructorDecl = constructorDecl;
    this.contractName = contractName;
  }

  validate(): boolean {
    const semanticValidator = new ConstructorSemanticValidator(this.constructorDecl);
    return semanticValidator.validate();
  }

  buildIR(): IRMethod {
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
      name: `${this.contractName}_constructor`,
      visibility: Visibility.PUBLIC,
      stateMutability: StateMutability.NONPAYABLE,
      outputs: [],
    };
  }
}
