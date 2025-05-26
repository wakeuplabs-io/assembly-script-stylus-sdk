import { PropertyDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_NAME: "Property must have a name",
  MISSING_TYPE: (propertyName: string) => `Property "${propertyName}" must have a type`,
  NON_STATIC: (propertyName: string) => `Property "${propertyName}" must be static`,
} as const;

export class PropertySyntaxValidator extends BaseValidator {
  private property: PropertyDeclaration;

  constructor(property: PropertyDeclaration, errorManager: ErrorManager) {
    super(errorManager, property.getSourceFile().getFilePath(), property.getStartLineNumber());
    this.property = property;
  }

  validate(): boolean {
    let hasErrors = false;
    if (!this.property.getName()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_NAME);
      hasErrors = true;
    }

    if (!this.property.getType().getText()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_TYPE(this.property.getName()));
      hasErrors = true;
    }

    if (!this.property.isStatic()) {
      this.addSemanticError(ERROR_MESSAGES.NON_STATIC(this.property.getName()));
      hasErrors = true;
    }

    return !hasErrors;
  }
}
