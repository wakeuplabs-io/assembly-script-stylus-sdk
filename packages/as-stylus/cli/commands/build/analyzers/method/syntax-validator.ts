import { MethodDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class MethodSyntaxValidator extends BaseValidator {
  private method: MethodDeclaration;

  constructor(method: MethodDeclaration, errorManager: ErrorManager) {
    super(errorManager, method.getSourceFile().getFilePath(), method.getStartLineNumber());
    this.method = method;
  }

  validate(): boolean {
    let hasErrors = false;

    if (!this.method.getName()) {
      this.addSyntaxError("E006");
      hasErrors = true;
    }

    return !hasErrors;
  }
}
