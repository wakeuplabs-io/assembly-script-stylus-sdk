import { SourceFile, ConstructorDeclaration, SyntaxKind, HeritageClause } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { ContractSemanticValidator } from "./semantic-validator.js";
import { ContractSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ConstructorIRBuilder } from "../constructor/ir-builder.js";
import { ErrorIRBuilder } from "../error/ir-builder.js";
import { EventIRBuilder } from "../event/ir-builder.js";
import { MethodIRBuilder } from "../method/ir-builder.js";
import { PropertyIRBuilder } from "../property/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StructIRBuilder } from "../struct/ir-builder.js";

export class ContractIRBuilder extends IRBuilder<IRContract> {
  private sourceFile: SourceFile;
  private contractName: string;

  constructor(sourceFile: SourceFile, contractName: string) {
    super(sourceFile);
    this.sourceFile = sourceFile;
    this.contractName = contractName;
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
        path: this.contractName,
        name: "Main",
        parents: [],
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

    const parents: string[] = [];
    const extendsExpr = classDefinition.getHeritageClauses().find(
      (h: HeritageClause) => h.getToken() === SyntaxKind.ExtendsKeyword
    );
    if (extendsExpr) {
      extendsExpr.getTypeNodes().forEach(typeNode => {
        parents.push(typeNode.getText());
      });
    }
  
    const name = classDefinition.getName();
    ctx.contractName = name ?? "Main";

    const structClasses = this.sourceFile.getClasses().filter(cls => {
      const decorators = cls.getDecorators();
      return decorators.some(decorator => decorator.getName() === 'Struct');
    });

    const structs = structClasses.map(structClass => {
      const structIRBuilder = new StructIRBuilder(structClass);
      return structIRBuilder.validateAndBuildIR();
    });

    structs.forEach(struct => {
      ctx.structRegistry.set(struct.name, struct);
    });

    const storage = classDefinition.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index);
      return propertyIRBuilder.validateAndBuildIR();
    });

    storage.forEach(variable => {
      ctx.slotMap.set(variable.name, variable.slot);
      ctx.variableTypes.set(variable.name, variable.type);
    });
    
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

    const errorClasses = this.sourceFile.getClasses().filter(cls => {
      const decorators = cls.getDecorators();
      return decorators.some(decorator => decorator.getName() === 'Error');
    });

    const errors = errorClasses.map(errorClass => {
      const errorIRBuilder = new ErrorIRBuilder(errorClass);
      return errorIRBuilder.validateAndBuildIR();
    });

    return {
      path: this.contractName,
      name: name ?? "Main",
      parents,
      constructor,
      methods,
      storage,
      events,
      structs,
      errors
    };
  }
}
