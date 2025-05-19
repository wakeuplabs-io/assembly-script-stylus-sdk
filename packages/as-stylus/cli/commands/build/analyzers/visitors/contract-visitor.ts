import { ClassDeclaration, ConstructorDeclaration, MethodDeclaration, PropertyDeclaration, SourceFile, Block } from "ts-morph";
import { AbiStateMutability, AbiVisibility, STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "../../../../types/abi.types.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { SemanticValidator } from "../validators/contract-semantic-validator.js";
import { SyntaxValidator } from "../validators/contract-syntax-validator.js";
import { toIRStmt } from "../helpers.js";

export interface ContractVisitor {
  visitSourceFile(sourceFile: SourceFile): IRContract;
  visitClass(classDecl: ClassDeclaration): void;
  visitConstructor(constructor: ConstructorDeclaration): void;
  visitMethod(method: MethodDeclaration): void;
  visitProperty(property: PropertyDeclaration, index: number): void;
}

export class ContractAnalyzer implements ContractVisitor {
  private contract: IRContract = {
    name: "Main",
    methods: [],
    storage: [],
    constructor: undefined
  };
  private semanticValidator: SemanticValidator;
  private syntaxValidator: SyntaxValidator;

  constructor(sourceFile: SourceFile) {
    this.semanticValidator = new SemanticValidator(sourceFile);
    this.syntaxValidator = new SyntaxValidator(sourceFile);
  }

  visitSourceFile(): IRContract {
    this.syntaxValidator.validateSourceFile();
    
    const classDecl = this.semanticValidator.validateSourceFile();
    
    this.contract.name = classDecl.getName() ?? "Main";
    this.semanticValidator.validateContractClass(classDecl);
    this.visitClass(classDecl);
    return this.contract;
  }

  visitClass(classDecl: ClassDeclaration): void {
    // Visit constructor
    const constructors = classDecl.getConstructors();
    if (constructors.length === 1) {
      this.visitConstructor(constructors[0]);
    }

    for (const method of classDecl.getStaticMethods()) {
      this.visitMethod(method);
    }

    classDecl.getStaticProperties()
      .filter(prop => prop.getKindName() === "PropertyDeclaration")
      .forEach((prop, index) => {
        if (prop instanceof PropertyDeclaration) {
          this.visitProperty(prop, index);
        }
      });
  }

  visitConstructor(constructor: ConstructorDeclaration): void {
    const inputs = constructor.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));
    const body = constructor.getBodyOrThrow() as Block;
    const irBody = body.getStatements().map(toIRStmt);
    
    this.contract.constructor = {
      inputs,
      ir: irBody
    };
  }

  visitMethod(method: MethodDeclaration): void {
    const name = method.getName();
    const decorators = method.getDecorators();

    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));

    const visibility: AbiVisibility = visDecorators[0]?.getName()?.toLowerCase() ?? "public";
    const stateMutability: AbiStateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? "nonpayable";

    const inputs = method.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));

    const returnType = method.getReturnType().getText();
    const body = method.getBodyOrThrow() as Block;
    const irBody = body.getStatements().map(toIRStmt);

    this.contract.methods.push({
      name,
      visibility,
      inputs,
      outputs: returnType === "void" ? [] : [{ type: returnType }],
      stateMutability,
      ir: irBody
    });
  }

  visitProperty(property: PropertyDeclaration, index: number): void {
    const name = property.getName();
    const type = property.getType().getText();
    
    this.contract.storage.push({
      name,
      type,
      slot: index
    });
  }
} 