import { SourceFile, ClassDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  SOURCE_FILE_EMPTY: "Source file is empty",
  NO_CLASS_DECLARATIONS: "No class declarations found in source file",
  CLASS_NAME_REQUIRED: "Class declaration must have a name",
} as const;

export class ContractSyntaxValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager, sourceFile.getFilePath(), sourceFile.getStartLineNumber());
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    let hasErrors = false;

    if (this.sourceFile.getFullText().trim().length === 0) {
      this.addSyntaxError(ERROR_MESSAGES.SOURCE_FILE_EMPTY);
      hasErrors = true;
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      this.addSyntaxError(ERROR_MESSAGES.NO_CLASS_DECLARATIONS);
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
      this.addSyntaxError(ERROR_MESSAGES.CLASS_NAME_REQUIRED);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
