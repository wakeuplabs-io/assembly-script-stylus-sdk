import { ConstructorDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ConstructorSyntaxValidator extends BaseValidator {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    let hasErrors = false;
    if (!this.constructorDecl.getBody()) {
      this.errorManager.addSyntaxError(
        "Constructor must have a body",
        this.constructorDecl.getSourceFile().getFilePath(),
        this.constructorDecl.getStartLineNumber(),
      );
      hasErrors = true;
    }

    for (const param of this.constructorDecl.getParameters()) {
      if (!param.getType().getText()) {
        this.errorManager.addSyntaxError(
          `Parameter "${param.getName()}" in constructor must have a type`,
          param.getSourceFile().getFilePath(),
          param.getStartLineNumber(),
        );
        hasErrors = true;
      }
    }

    return !hasErrors;
  }
}
