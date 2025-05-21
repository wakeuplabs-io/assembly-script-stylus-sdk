import { SourceFile, ClassDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ContractSyntaxValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager);
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    let hasErrors = false;

    if (this.sourceFile.getFullText().trim().length === 0) {
      this.errorManager.addSyntaxError(
        "Source file is empty",
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber(),
      );
      hasErrors = true;
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      this.errorManager.addSyntaxError(
        "No class declarations found in source file",
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber(),
      );
      hasErrors = true;
    }

    for (const classDecl of classes) {
      this.validateClass(classDecl);
    }

    return !hasErrors;
  }

  private validateClass(classDecl: ClassDeclaration): boolean {
    let hasErrors = false;

    if (!classDecl.getName()) {
      this.errorManager.addSyntaxError(
        "Class declaration must have a name",
        classDecl.getSourceFile().getFilePath(),
        classDecl.getStartLineNumber(),
      );
      hasErrors = true;
    }

    return !hasErrors;
  }
}
