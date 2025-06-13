import { SourceFile } from "ts-morph";

import { ErrorManager } from "@/cli/commands/build/analyzers/shared/error-manager.js";

import { ERROR_CODES } from "../../errors/codes.js";
import { BaseValidator } from "../shared/base-validator.js";

export class ContractSemanticValidator extends BaseValidator {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    super(errorManager, sourceFile.getFilePath(), sourceFile.getStartLineNumber());
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    const classesWithDecorators = this.sourceFile
      .getClasses()
      .filter((cls) =>
        cls.getDecorators().some((dec) => dec.getName().toLowerCase() === "contract"),
      );

    if (classesWithDecorators.length === 0) {
      this.addSemanticError(ERROR_CODES.NO_CONTRACT_DECORATOR_FOUND);
      return true;
    } 
    
    if (classesWithDecorators.length > 1) {
      this.addSemanticError(ERROR_CODES.MULTIPLE_CONTRACTS_FOUND);
      return true;
    }

    const classDefined = classesWithDecorators[0];
    if (classDefined.getDecorators().length > 1) {
      this.addSemanticError(ERROR_CODES.MULTIPLE_CONTRACT_DECORATORS_FOUND, [classDefined.getName()!]);
      return true;
    }

    return false;
  }
}

