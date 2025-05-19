import { ClassDeclaration, MethodDeclaration, SourceFile } from "ts-morph";
import { STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "../../../../types/abi.types.js";
import { ErrorManager } from "../errors/error-manager.js";

export class SemanticValidator {
  private sourceFile: SourceFile;
  private errorManager: ErrorManager;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    this.sourceFile = sourceFile;
    this.errorManager = errorManager;
  }

  validateSourceFile(): ClassDeclaration | null {
    const classDecl = this.sourceFile.getClasses().filter(cls => cls.getDecorators().some(dec => dec.getName().toLowerCase() === "contract"));
    if (classDecl.length === 0 || classDecl.length > 1) {
      const errorMessage = classDecl.length === 0 ? "No class decorated with @Contract was found" : "Only one class decorated with @Contract is allowed";

      this.errorManager.addError(
        errorMessage,
        "semantic",
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber()
      );
      return null;
    }
    const contractClass = classDecl[0];

    this.validateContractClass(contractClass);
    return classDecl[0];
  }

  validateContractClass(classDecl: ClassDeclaration): void {
    if (classDecl.getDecorators().length > 1) {
      this.errorManager.addError(
        `Contract class "${classDecl.getName()}" has multiple @Contract decorators`,
        "semantic",
        classDecl.getSourceFile().getFilePath(),
        classDecl.getStartLineNumber()
      );
    }

    this.validateConstructor(classDecl);
    this.validateMethods(classDecl);
  }

  private validateConstructor(classDecl: ClassDeclaration): void {
    const constructors = classDecl.getConstructors();
    if (constructors.length > 1) {
      this.errorManager.addError(
        `Contract class "${classDecl.getName()}" has more than one constructor`,
        "semantic",
        classDecl.getSourceFile().getFilePath(),
        classDecl.getStartLineNumber()
      );
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
      this.errorManager.addError(
        `Method "${name}" has multiple visibility decorators: ${visDecorators.map(d => d.getName()).join(", ")}`,
        "semantic",
        method.getSourceFile().getFilePath(),
        method.getStartLineNumber()
      );
    }

    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));
    if (stateDecorators.length > 1) {
      this.errorManager.addError(
        `Method "${name}" has multiple mutability decorators: ${stateDecorators.map(d => d.getName()).join(", ")}`,
        "semantic",
        method.getSourceFile().getFilePath(),
        method.getStartLineNumber()
      );
    }
  }
} 