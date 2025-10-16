import {
  SourceFile,
  ConstructorDeclaration,
  ClassDeclaration,
  SyntaxKind,
  CallExpression,
  VariableDeclaration,
  Statement,
} from "ts-morph";

import { IRContract, IRErrorDecl, IREvent, IRStatement } from "@/cli/types/ir.types.js";

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
import { SlotManager } from "../shared/slot-manager.js";
import { SymbolTableStack } from "../shared/symbol-table.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";
import { StructIRBuilder } from "../struct/ir-builder.js";

const DECORATORS = {
  CONTRACT: "Contract",
  STRUCT: "StructTemplate",
  EVENT: "Event",
  ERROR: "Error",
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

    // Process inheritance
    const parent = this.processInheritance(contractClass);
    this.symbolTable.merge(parent?.symbolTable ?? new SymbolTableStack(this.slotManager));
    this.slotManager.merge(parent?.slotManager ?? new SlotManager());

    // Process all class-based components
    const structs = this.processStructs(classes);
    const events = this.processEvents();
    const errors = this.processErrors(classes);
    const constants = this.processGlobalConstants();
    const storage = this.processStorage(contractClass);
    const constructor = this.processConstructor(contractClass);
    const methodsResult = this.processMethods(contractClass);

    return {
      path: this.contractName,
      name: this.contractName,
      parent,
      constructor,
      methods: methodsResult.methods,
      fallback: methodsResult.fallback,
      receive: methodsResult.receive,
      storage,
      constants,
      events,
      structs,
      errors,
      symbolTable: this.symbolTable,
      slotManager: this.slotManager,
    };
  }

  private createEmptyContract(): IRContract {
    return {
      path: this.contractName,
      name: "Main",
      constructor: undefined,
      methods: [],
      storage: [],
      constants: [],
      symbolTable: new SymbolTableStack(this.slotManager),
      slotManager: this.slotManager,
    };
  }

  private findContractClass(classes: ClassDeclaration[]): ClassDeclaration | undefined {
    const contractClass = classes.find((cls) => this.hasDecorator(cls, DECORATORS.CONTRACT));

    if (contractClass) {
      return contractClass;
    }

    return classes.length > 0 ? classes[0] : undefined;
  }

  private hasDecorator(cls: ClassDeclaration, decoratorName: string): boolean {
    return cls.getDecorators().some((decorator) => decorator.getName() === decoratorName);
  }

  private filterClassesByDecorator(
    classes: ClassDeclaration[],
    decoratorName: string,
  ): ClassDeclaration[] {
    return classes.filter((cls) => this.hasDecorator(cls, decoratorName));
  }

  private handleNoContractClassError(): void {
    this.errorManager.addSemanticError("NO_CONTRACT_CLASS", this.sourceFile.getFilePath(), 1, [
      "No contract class found in the file.",
    ]);
  }

  private processInheritance(contractClass: ClassDeclaration): IRContract | undefined {
    return new InheritanceIRBuilder(this.sourceFile, contractClass).buildIR();
  }

  private processStructs(classes: ClassDeclaration[]) {
    const structClasses = this.filterClassesByDecorator(classes, DECORATORS.STRUCT);

    const structs = structClasses.map((structClass) => {
      const structIRBuilder = new StructIRBuilder(structClass);
      return structIRBuilder.validateAndBuildIR();
    });

    structs.forEach((struct) => {
      this.symbolTable.declareStruct(struct.name, struct);
    });

    return structs;
  }

  private processEvents(): IREvent[] {
    const events: IREvent[] = [];
    const sourceFile = this.sourceFile;

    // Find all EventFactory.create<T>() calls
    const eventFactoryCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of eventFactoryCalls) {
      const expr = call.getExpression();

      if (expr.getText() === "EventFactory.create") {
        const parent = call.getParent();

        if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
          const varDecl = parent as VariableDeclaration;

          const eventIRBuilder = new EventIRBuilder(varDecl);
          const eventIR = eventIRBuilder.validateAndBuildIR();

          events.push(eventIR);
        }
      }
    }
    return events;
  }

  private processErrors(classes: ClassDeclaration[]) {
    const errors: IRErrorDecl[] = [];

    // TODO: Remove this once we have a proper way to handle ErrorFactory.create<T>() calls
    const errorClasses = this.filterClassesByDecorator(classes, DECORATORS.ERROR);
    errorClasses.forEach((errorClass) => {
      const errorIRBuilder = new ErrorIRBuilder(errorClass);
      errors.push(errorIRBuilder.validateAndBuildIR());
    });

    // Process ErrorFactory.create<T>() calls
    const errorFactoryErrors = this.processErrorFactoryCalls();
    errors.push(...errorFactoryErrors);

    return errors;
  }

  private processErrorFactoryCalls(): IRErrorDecl[] {
    const errors: IRErrorDecl[] = [];
    const sourceFile = this.sourceFile;

    // Find all ErrorFactory.create<T>() calls
    const errorFactoryCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of errorFactoryCalls) {
      const expr = call.getExpression();

      if (expr.getText() === "ErrorFactory.create") {
        // Create a synthetic class declaration for the error
        const parent = call.getParent();

        if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
          const varDecl = parent as VariableDeclaration;
          const errorName = varDecl.getName();

          const syntheticClass = this.createSyntheticErrorClass(errorName, call);

          const errorIRBuilder = new ErrorIRBuilder(syntheticClass);
          const errorIR = errorIRBuilder.validateAndBuildIR();

          errors.push(errorIR);
        }
      }
    }

    return errors;
  }

  private createSyntheticErrorClass(
    errorName: string,
    errorFactoryCall: CallExpression,
  ): ClassDeclaration {
    const sourceFile = this.sourceFile;

    const tempClass = sourceFile.addClass({
      name: errorName,
      isExported: false,
      decorators: [],
    });

    (tempClass as any).errorFactoryCall = errorFactoryCall;

    return tempClass;
  }

  private processStorage(contractClass: ClassDeclaration) {
    const storage = contractClass.getProperties().map((property) => {
      const propertyIRBuilder = new PropertyIRBuilder(property);
      return propertyIRBuilder.validateAndBuildIR();
    });

    return storage;
  }

  private processConstructor(contractClass: ClassDeclaration) {
    const constructorDecl: ConstructorDeclaration = contractClass.getConstructors()[0];

    if (!constructorDecl) {
      return undefined;
    }

    const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl, this.contractName);
    return constructorIRBuilder.validateAndBuildIR();
  }

  private processMethods(contractClass: ClassDeclaration) {
    const methods = contractClass.getMethods();

    // First pass: register all method names in symbol table
    const methodNames = methods.map((method) => {
      const name = method.getName();
      this.symbolTable.declareFunction(name, {
        returnType: convertType(this.symbolTable, method.getReturnType().getText()),
        isDeclaredByUser: true,
        name: name,
        parameters: method.getParameters().map((param) => ({
          name: param.getName(),
          type: convertType(this.symbolTable, param.getType().getText()),
        })),
      });
      return name;
    });

    // Build IR for all methods
    const allMethods = methods.map((method) => {
      const methodIRBuilder = new MethodIRBuilder(method, methodNames);
      return methodIRBuilder.validateAndBuildIR();
    });

    // Separate methods by type
    const normalMethods = allMethods.filter(
      (method) => !method.methodType || method.methodType === "normal",
    );
    const fallbackMethod = allMethods.find((method) => method.methodType === "fallback");
    const receiveMethod = allMethods.find((method) => method.methodType === "receive");

    // Validate only one fallback and one receive per contract
    const fallbackMethods = allMethods.filter((method) => method.methodType === "fallback");
    const receiveMethods = allMethods.filter((method) => method.methodType === "receive");

    if (fallbackMethods.length > 1) {
      this.errorManager.addSemanticError(
        "MULTIPLE_FALLBACK_FUNCTIONS",
        this.sourceFile.getFilePath(),
        1,
        ["Only one fallback function is allowed per contract."],
      );
    }

    if (receiveMethods.length > 1) {
      this.errorManager.addSemanticError(
        "MULTIPLE_RECEIVE_FUNCTIONS",
        this.sourceFile.getFilePath(),
        1,
        ["Only one receive function is allowed per contract."],
      );
    }

    return {
      methods: normalMethods,
      fallback: fallbackMethod,
      receive: receiveMethod,
    };
  }

  private processGlobalConstants(): IRStatement[] {
    const constants: IRStatement[] = [];
    
    // Get all variable statements at the file level (not inside classes)
    const variableStatements = this.sourceFile.getVariableStatements();
    const varStatementsFiltered = variableStatements.filter(stmt => 
      !stmt.getText().includes("EventFactory.create") && 
      !stmt.getText().includes("ErrorFactory.create"));
    
    for (const varStatement of varStatementsFiltered) {
      const declarations = new StatementIRBuilder(varStatement as unknown as Statement).validateAndBuildIR();
      constants.push({ ...declarations, isConstant: true } as any);
    }
    
    return constants;
  }
}
