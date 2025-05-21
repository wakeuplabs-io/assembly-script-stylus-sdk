import { PropertyDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class PropertySyntaxValidator extends BaseValidator {
  private property: PropertyDeclaration;

  constructor(property: PropertyDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.property = property;
  }

  validate(): boolean {
    let hasErrors = false;
    if (!this.property.getName()) {
      this.errorManager.addSyntaxError(
        "Property must have a name",
        this.property.getSourceFile().getFilePath(),
        this.property.getStartLineNumber(),
      );
      hasErrors = true;
    }

    if (!this.property.getType().getText()) {
      this.errorManager.addSyntaxError(
        `Property "${this.property.getName()}" must have a type`,
        this.property.getSourceFile().getFilePath(),
        this.property.getStartLineNumber(),
      );
      hasErrors = true;
    }

    if (!this.property.isStatic()) {
      this.errorManager.addSemanticError(
        `Property "${this.property.getName()}" must be static`,
        this.property.getSourceFile().getFilePath(),
        this.property.getStartLineNumber(),
      );
      hasErrors = true;
    }

    return !hasErrors;
  }
}
