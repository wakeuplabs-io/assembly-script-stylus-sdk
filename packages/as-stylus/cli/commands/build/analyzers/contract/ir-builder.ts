import { SourceFile, ConstructorDeclaration } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { ContractSemanticValidator } from "./semantic-validator.js";
import { ContractSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ConstructorIRBuilder } from "../constructor/ir-builder.js";
import { EventIRBuilder } from "../event/ir-builder.js";
import { MethodIRBuilder } from "../method/ir-builder.js";
import { PropertyIRBuilder } from "../property/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ContractIRBuilder extends IRBuilder<IRContract> {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile) {
    super(sourceFile);
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    const syntaxValidator = new ContractSyntaxValidator(this.sourceFile);
    const semanticValidator = new ContractSemanticValidator(this.sourceFile);

    const syntaxErrors = syntaxValidator.validate();
    const semanticErrors = semanticValidator.validate();

    return syntaxErrors || semanticErrors;
  }

  buildIR(): IRContract {
    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      return {
        name: "Main",
        constructor: undefined,
        methods: [],
        storage: [],
      };
    }

    
    let classDefinition = classes.find(cls => {
      const decorators = cls.getDecorators();
      return decorators.some(decorator => decorator.getName() === 'Contract');
    });
    
    if (!classDefinition && classes.length > 0) {
      classDefinition = classes[0];
    }
    
    if (!classDefinition) {
      this.errorManager.addSemanticError(
        "NO_CONTRACT_CLASS",
        this.sourceFile.getFilePath(),
        1,
        ["No contract class found in the file."]
      );
      throw new Error("No contract class found");
    }
    
    const name = classDefinition.getName();

    const storage = classDefinition.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index);
      return propertyIRBuilder.validateAndBuildIR();
    });

    for (const v of storage) {
      ctx.slotMap.set(v.name, v.slot);
    }
    
    const constructorDecl: ConstructorDeclaration =
      classDefinition.getConstructors()[0];
    let constructor;
    if(constructorDecl) {
      const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl);
      constructor = constructorIRBuilder.validateAndBuildIR();
    }

    const names = classDefinition.getMethods().map(method => {
      const name = method.getName();
      this.symbolTable.declareFunction(name, {
        returnType: convertType(method.getReturnType().getText()),
        name: name,
        parameters: method.getParameters().map(param => ({
          name: param.getName(),
          type: convertType(param.getType().getText()),
        })),
      });
      return name;
    });

    const methods = classDefinition.getMethods().map((method) => {
      const methodIRBuilder = new MethodIRBuilder(method, names);
      return methodIRBuilder.validateAndBuildIR();
    });

    const eventClasses = this.sourceFile.getClasses().filter(cls => {
      const decorators = cls.getDecorators();
      return decorators.some(decorator => decorator.getName() === 'Event');
    });

    const events = eventClasses.map(eventClass => {
      const eventIRBuilder = new EventIRBuilder(eventClass);
      return eventIRBuilder.validateAndBuildIR();
    });

    return {
      name: name ?? "Main",
      constructor,
      methods,
      storage,
      events
    };
  }
}
