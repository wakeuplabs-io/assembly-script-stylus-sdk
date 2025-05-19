import { ClassDeclaration, MethodDeclaration, SourceFile } from "ts-morph";
import { STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "../../../../types/abi.types.js";

export class SemanticValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }

  validateSourceFile(): ClassDeclaration {
    const classDecl = this.sourceFile.getClasses().find(cls =>
      cls.getDecorators().some(dec => dec.getName().toLowerCase() === "contract")
    );
    
    if (!classDecl) {
      throw new Error(`[semantic] No class decorated with @Contract was found.`);
    }

    return classDecl;
  }

  validateContractClass(classDecl: ClassDeclaration): void {
    this.validateConstructor(classDecl);
    this.validateMethods(classDecl);
  }

  private validateConstructor(classDecl: ClassDeclaration): void {
    const constructors = classDecl.getConstructors();
    if (constructors.length > 1) {
      throw new Error(`[semantic] Contract class "${classDecl.getName()}" has more than one constructor.`);
    }
  }

  private validateMethods(classDecl: ClassDeclaration): void {
    for (const method of classDecl.getStaticMethods()) {
      this.validateMethod(method);
    }
  }

  private validateMethod(method: MethodDeclaration): void {
    const name = method.getName();
    const decorators = method.getDecorators();

    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    if (visDecorators.length > 1) {
      throw new Error(`[semantic] Method "${name}" has multiple visibility decorators: ${visDecorators.map(d => d.getName()).join(", ")}`);
    }

    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));
    if (stateDecorators.length > 1) {
      throw new Error(`[semantic] Method "${name}" has multiple mutability decorators: ${stateDecorators.map(d => d.getName()).join(", ")}`);
    }
  }
} 