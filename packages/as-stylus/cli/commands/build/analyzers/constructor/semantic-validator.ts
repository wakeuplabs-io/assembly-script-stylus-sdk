import { ConstructorDeclaration } from "ts-morph";

import { ERROR_CODES } from "../../errors/codes.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ConstructorSemanticValidator {
  constructor(private readonly constructorDecl: ConstructorDeclaration, private readonly errorManager: ErrorManager) {}

  validate(): boolean {
    let hasErrors = false;

    if (this.constructorDecl.getModifiers().some(modifier => modifier.getText() === "private" || modifier.getText() === "protected")) {
      this.errorManager.addSemanticError(ERROR_CODES.NO_CONSTRUCTOR_FOUND);
      hasErrors = true;
    }

    return !hasErrors;
  }
}