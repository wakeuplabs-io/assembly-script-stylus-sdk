import { SourceFile, ClassDeclaration } from "ts-morph";

import { ERROR_CODES } from "../../errors/codes.js";
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
      this.addSyntaxError(ERROR_CODES.EMPTY_SOURCE_FILE);
      hasErrors = true;
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      this.addSyntaxError(ERROR_CODES.NO_CLASSES_FOUND);
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
      this.addSyntaxError(ERROR_CODES.CLASS_HAS_NO_NAME);
      hasErrors = true;
    }

    if (classDecl.getConstructors().length > 1) {
      this.addSyntaxError(ERROR_CODES.MULTIPLE_CONSTRUCTORS_FOUND);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
