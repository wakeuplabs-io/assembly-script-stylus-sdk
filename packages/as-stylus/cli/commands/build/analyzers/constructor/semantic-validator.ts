import { ConstructorDeclaration } from "ts-morph";

import { ERROR_CODES } from "../../errors/codes.js";
import { BaseValidator } from "../shared/base-validator.js";

export class ConstructorSemanticValidator extends BaseValidator {
  private constructorDecl: ConstructorDeclaration;

  constructor(constructorDecl: ConstructorDeclaration) {
    super(constructorDecl);
    this.constructorDecl = constructorDecl;
  }

  validate(): boolean {
    let hasErrors = false;

    if (
      this.constructorDecl
        .getModifiers()
        .some((modifier) => modifier.getText() === "private" || modifier.getText() === "protected")
    ) {
      this.addSemanticError(ERROR_CODES.NO_CONSTRUCTOR_FOUND);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
