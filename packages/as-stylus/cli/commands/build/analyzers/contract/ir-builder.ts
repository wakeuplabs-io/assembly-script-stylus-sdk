import { SourceFile, ConstructorDeclaration, ClassDeclaration } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { ContractSemanticValidator } from "./semantic-validator.js";
import { ContractSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ConstructorIRBuilder } from "../constructor/ir-builder.js";
import { ErrorIRBuilder } from "../error/ir-builder.js";
import { EventIRBuilder } from "../event/ir-builder.js";
import { InheritanceIRBuilder } from "../inheritance/ir-builder.js";
import { MethodIRBuilder } from "../method/ir-builder.js";
import { PropertyIRBuilder } from "../property/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";
import { StructIRBuilder } from "../struct/ir-builder.js";

const DECORATORS = {
  CONTRACT: 'Contract',
  STRUCT: 'Struct',
  EVENT: 'Event',
  ERROR: 'Error'
} as const;

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
      return this.createEmptyContract();
    }

    const contractClass = this.findContractClass(classes);
    if (!contractClass) {
      this.handleNoContractClassError();
      throw new Error("No contract class found");
    }

    const contractName = contractClass.getName() ?? "Main";
    ctx.contractName = contractName;

    // Process inheritance
    const parent = this.processInheritance(contractClass);
    this.symbolTable.merge(parent?.symbolTable ?? new SymbolTableStack());

    // Process all class-based components
    const structs = this.processStructs(classes);
    const events = this.processEvents(classes);
    const errors = this.processErrors(classes);
    const storage = this.processStorage(contractClass);
    const constructor = this.processConstructor(contractClass);
    const methods = this.processMethods(contractClass);

    return {
      path: this.contractName,
      name: contractName,
      parent,
      constructor,
      methods,
      storage,
      events,
      structs,
      errors,
      symbolTable: this.symbolTable,
    };
  }

  private createEmptyContract(): IRContract {
    return {
      path: this.contractName,
      name: "Main",
      constructor: undefined,
      methods: [],
      storage: [],
      symbolTable: new SymbolTableStack(),
    };
  }

  private findContractClass(classes: ClassDeclaration[]): ClassDeclaration | undefined {
    const contractClass = classes.find(cls => 
      this.hasDecorator(cls, DECORATORS.CONTRACT)
    );
    
    if (contractClass) {
      return contractClass;
    }

    return classes.length > 0 ? classes[0] : undefined;
  }

  private hasDecorator(cls: ClassDeclaration, decoratorName: string): boolean {
    return cls.getDecorators().some(decorator => 
      decorator.getName() === decoratorName
    );
  }

  private filterClassesByDecorator(classes: ClassDeclaration[], decoratorName: string): ClassDeclaration[] {
    return classes.filter(cls => this.hasDecorator(cls, decoratorName));
  }

  private handleNoContractClassError(): void {
    this.errorManager.addSemanticError(
      "NO_CONTRACT_CLASS",
      this.sourceFile.getFilePath(),
      1,
      ["No contract class found in the file."]
    );
  }

  private processInheritance(contractClass: ClassDeclaration): IRContract | undefined {
    return new InheritanceIRBuilder(this.sourceFile, contractClass).buildIR();
  }

  private processStructs(classes: ClassDeclaration[]) {
    const structClasses = this.filterClassesByDecorator(classes, DECORATORS.STRUCT);
    
    const structs = structClasses.map(structClass => {
      const structIRBuilder = new StructIRBuilder(structClass);
      return structIRBuilder.validateAndBuildIR();
    });

    structs.forEach(struct => {
      ctx.structRegistry.set(struct.name, struct);
    });

    return structs;
  }

  private processEvents(classes: ClassDeclaration[]) {
    const eventClasses = this.filterClassesByDecorator(classes, DECORATORS.EVENT);
    
    return eventClasses.map(eventClass => {
      const eventIRBuilder = new EventIRBuilder(eventClass);
      return eventIRBuilder.validateAndBuildIR();
    });
  }

  private processErrors(classes: ClassDeclaration[]) {
    const errorClasses = this.filterClassesByDecorator(classes, DECORATORS.ERROR);
    
    return errorClasses.map(errorClass => {
      const errorIRBuilder = new ErrorIRBuilder(errorClass);
      return errorIRBuilder.validateAndBuildIR();
    });
  }

  private processStorage(contractClass: ClassDeclaration) {
    const storage = contractClass.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index + 1);
      return propertyIRBuilder.validateAndBuildIR();
    });

    storage.forEach(variable => {
      ctx.slotMap.set(variable.name, variable.slot);
      ctx.variableTypes.set(variable.name, variable.type);
    });

    return storage;
  }

  private processConstructor(contractClass: ClassDeclaration) {
    const constructorDecl: ConstructorDeclaration = contractClass.getConstructors()[0];
    
    if (!constructorDecl) {
      return undefined;
    }

    const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl);
    return constructorIRBuilder.validateAndBuildIR();
  }

  private processMethods(contractClass: ClassDeclaration) {
    const methods = contractClass.getMethods();
    
    // First pass: register all method names in symbol table
    const methodNames = methods.map(method => {
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

    return methods.map((method) => {
      const methodIRBuilder = new MethodIRBuilder(method, methodNames);
      return methodIRBuilder.validateAndBuildIR();
    });
  }
}
