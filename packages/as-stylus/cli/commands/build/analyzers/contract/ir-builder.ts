import { ClassDeclaration, SourceFile, ConstructorDeclaration } from "ts-morph";

import { IRContract } from "@/cli/types/ir.types.js";

import { ContractSemanticValidator } from "./semantic-validator.js";
import { ContractSyntaxValidator } from "./syntax-validator.js";
import { ConstructorIRBuilder } from "../constructor/ir-builder.js";
import { MethodIRBuilder } from "../method/ir-builder.js";
import { PropertyIRBuilder } from "../property/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ContractIRBuilder extends IRBuilder<IRContract> {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager);
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    const syntaxValidator = new ContractSyntaxValidator(this.sourceFile, this.errorManager);
    const semanticValidator = new ContractSemanticValidator(this.sourceFile, this.errorManager);

    const syntaxErrors = syntaxValidator.validate();
    const semanticErrors = semanticValidator.validate();

    return syntaxErrors || semanticErrors;
  }

  buildIR(): IRContract {
    const classes = this.sourceFile.getClasses();
    const classDefinition = classes[0];
    const name = classDefinition.getName();

    const constructorDecl: ConstructorDeclaration | undefined =
      classDefinition.getConstructors()[0];
    const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl, this.errorManager);
    const constructor = constructorIRBuilder.validateAndBuildIR();

    const methods = classDefinition.getMethods().map((method) => {
      const methodIRBuilder = new MethodIRBuilder(method, this.errorManager);
      return methodIRBuilder.validateAndBuildIR();
    });

    const storage = classDefinition.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index, this.errorManager);
      return propertyIRBuilder.validateAndBuildIR();
    });

    return {
      name: name ?? "Main",
      constructor,
      methods,
      storage,
    };
  }
}
