import { VariableDeclaration } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_INITIALIZER: "Variable declaration must have an initializer",
  INVALID_NAME: "Variable must have a valid name",
  UNSUPPORTED_TYPE: (type: string, supportedTypes: string[]) => 
    `Unsupported variable type: ${type}. Supported types are: ${supportedTypes.join(", ")}`
} as const;

export class VariableSyntaxValidator extends BaseValidator {
  constructor(
    private declaration: VariableDeclaration,
    errorManager: ErrorManager,
  ) {
    super(errorManager, declaration.getSourceFile().getFilePath(), declaration.getEndLineNumber());
  }

  validate(): boolean {
    let hasErrors = false;
    // Check if the variable has an initializer
    if (!this.declaration.hasInitializer()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_INITIALIZER);
      hasErrors = true;
    }

    // Check if the variable name is valid
    const name = this.declaration.getName();
    if (!name || name.trim() === "") {
      this.addSyntaxError(ERROR_MESSAGES.INVALID_NAME);
      hasErrors = true;
    }

    // Check if the variable type is supported
    const type = this.declaration.getType().getText();
    const supportedTypes = ["U256", "string", "boolean", "address"];
    if (!supportedTypes.includes(type)) {
      this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(type, supportedTypes));
      hasErrors = true;
    }

    return !hasErrors;
  }
}
