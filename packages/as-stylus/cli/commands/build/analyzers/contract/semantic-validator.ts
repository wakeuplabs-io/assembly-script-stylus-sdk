import { SourceFile } from "ts-morph";

import { ErrorManager } from "@/cli/commands/build/analyzers/shared/error-manager.js";

import { BaseValidator } from "../shared/base-validator.js";

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
      this.addSemanticError("S001");
      return true;
    } 
    
    if (classesDefined.length > 1) {
      this.addSemanticError("S002");
      return true;
    }

    const classDefined = classesDefined[0];
    if (classDefined.getDecorators().length > 1) {
      this.addSemanticError("S003", [classDefined.getName()!]);
      return true;
    }

    return false;
  }
}

