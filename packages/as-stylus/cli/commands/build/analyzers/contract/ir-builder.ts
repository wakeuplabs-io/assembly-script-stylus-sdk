import {
  ClassDeclaration,
  SourceFile,
  ConstructorDeclaration
} from "ts-morph";
import { IRContract } from "@/cli/types/ir.types.js";
import { IRBuilder } from "../shared/ir-builder";
import { ErrorManager } from "../shared/error-manager";
import { ContractSyntaxValidator } from "./syntax-validator";
import { ContractSemanticValidator } from "./semantic-validator";
import { ConstructorIRBuilder } from "../constructor/ir-builder";
import { MethodIRBuilder } from "../method/ir-builder";
import { PropertyIRBuilder } from "../property/ir-builder";

export class ContractIRBuilder extends IRBuilder<IRContract> {
  private sourceFile: SourceFile;

  constructor(
    sourceFile: SourceFile,
    errorManager: ErrorManager,
  ) {
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

  build(): IRContract {
    const name = this.sourceFile.getBaseName() ?? "Main";
    const classes = this.sourceFile.getClasses();
    const classDefinition = classes[0];

    const constructorDecl: ConstructorDeclaration | undefined = classDefinition.getConstructors()[0];
    const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl, this.errorManager);
    const constructor = constructorIRBuilder.build();

    const methods = classDefinition.getMethods().map(method => {
      const methodIRBuilder = new MethodIRBuilder(method, this.errorManager);
      return methodIRBuilder.build();
    });

    const storage = classDefinition.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index, this.errorManager);
      return propertyIRBuilder.build();
    });
   
    return {
      name,
      constructor,
      methods,
      storage
    };
  }
}
