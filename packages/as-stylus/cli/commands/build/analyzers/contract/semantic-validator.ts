import { SourceFile } from "ts-morph";

import { ErrorManager } from "@/cli/commands/build/analyzers/shared/error-manager.js";

import { BaseValidator } from "../shared/base-validator.js";

const ERROR_MESSAGES = {
  NO_CONTRACT_CLASS: "No class decorated with @Contract was found",
  MULTIPLE_CONTRACT_CLASSES: "Only one class decorated with @Contract is allowed",
  MULTIPLE_CONTRACT_DECORATORS: (className: string) => `Contract class "${className}" has multiple @Contract decorators`,
} as const;

export class ContractSemanticValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager, sourceFile.getFilePath(), sourceFile.getStartLineNumber());
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    const classesDefined = this.sourceFile
      .getClasses()
      .filter((cls) =>
        cls.getDecorators().some((dec) => dec.getName().toLowerCase() === "contract"),
      );

    if (classesDefined.length === 0) {
      this.addSemanticError(ERROR_MESSAGES.NO_CONTRACT_CLASS);
      return true;
    } 
    
    if (classesDefined.length > 1) {
      this.addSemanticError(ERROR_MESSAGES.MULTIPLE_CONTRACT_CLASSES);
      return true;
    }

    const classDefined = classesDefined[0];
    if (classDefined.getDecorators().length > 1) {
      this.addSemanticError(ERROR_MESSAGES.MULTIPLE_CONTRACT_DECORATORS(classDefined.getName()!));
      return true;
    }

    return false;
  }
}

