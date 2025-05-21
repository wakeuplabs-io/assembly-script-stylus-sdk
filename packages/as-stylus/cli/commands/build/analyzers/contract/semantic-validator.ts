import { SourceFile } from "ts-morph";

import { ErrorManager } from "@/cli/commands/build/analyzers/shared/error-manager.js";

import { BaseValidator } from "../shared/base-validator.js";

export class ContractSemanticValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager);
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    let hasErrors = false;

    const classesDefined = this.sourceFile
      .getClasses()
      .filter((cls) =>
        cls.getDecorators().some((dec) => dec.getName().toLowerCase() === "contract"),
      );

    if (classesDefined.length === 0 || classesDefined.length > 1) {
      const errorMessage =
        classesDefined.length === 0
          ? "No class decorated with @Contract was found"
          : "Only one class decorated with @Contract is allowed";

      this.errorManager.addSemanticError(
        errorMessage,
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber(),
      );

      hasErrors = true;
    }

    const classDefined = classesDefined[0];
    if (classDefined.getDecorators().length > 1) {
      this.errorManager.addSemanticError(
        `Contract class "${classDefined.getName()}" has multiple @Contract decorators`,
        classDefined.getSourceFile().getFilePath(),
        classDefined.getStartLineNumber(),
      );

      hasErrors = true;
    }

    return !hasErrors;
  }
}

/*
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
*/
