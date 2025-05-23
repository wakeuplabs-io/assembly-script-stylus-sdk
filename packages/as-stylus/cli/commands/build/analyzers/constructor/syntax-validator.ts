import { ConstructorDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_BODY: "Constructor must have a body",
  MISSING_PARAMETER_TYPE: (paramName: string) => `Parameter "${paramName}" in constructor must have a type`,
} as const;

export class ConstructorSyntaxValidator extends BaseValidator {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration, errorManager: ErrorManager) {
    super(errorManager, constructorDecl.getSourceFile().getFilePath(), constructorDecl.getStartLineNumber());
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    let hasErrors = false;
    if (!this.constructorDecl.getBody()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_BODY);
      hasErrors = true;
    }

    for (const param of this.constructorDecl.getParameters()) {
      if (!param.getType().getText()) {
        this.addSyntaxError(ERROR_MESSAGES.MISSING_PARAMETER_TYPE(param.getName()));
        hasErrors = true;
      }
    }

    return !hasErrors;
  }
}
