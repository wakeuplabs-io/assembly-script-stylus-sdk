import { SourceFile, ClassDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ContractSyntaxValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager, sourceFile.getFilePath(), sourceFile.getStartLineNumber());
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    let hasErrors = false;

    if (this.sourceFile.getFullText().trim().length === 0) {
      this.addSyntaxError("E001");
      hasErrors = true;
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      this.addSyntaxError("E002");
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
      this.addSyntaxError("E003");
      hasErrors = true;
    }

    if (classDecl.getConstructors().length > 1) {
      this.addSyntaxError("E004");
      hasErrors = true;
    }

    return !hasErrors;
  }
}
