import { VariableDeclaration } from "ts-morph";

import { convertType } from "../../builder/build-abi.js";
import { BaseValidator } from "../shared/base-validator.js";
import { SUPPORTED_TYPES } from "../shared/supported-types.js";

const ERROR_MESSAGES = {
  MISSING_INITIALIZER: "Variable declaration must have an initializer",
  INVALID_NAME: "Variable must have a valid name",
  UNSUPPORTED_TYPE: (type: string, supportedTypes: string[]) => 
    `Unsupported variable type: ${type}. Supported types are: ${supportedTypes.join(", ")}`
} as const;

export class VariableDeclarationSyntaxValidator extends BaseValidator {
  private declaration: VariableDeclaration;

  constructor(declaration: VariableDeclaration) {
    super(declaration);
    this.declaration = declaration;
  }

  validate(): boolean {
    let hasErrors = false;

    // Check if the variable name is valid
    const name = this.declaration.getName();
    if (!name || name.trim() === "") {
      this.addSyntaxError(ERROR_MESSAGES.INVALID_NAME);
      hasErrors = true;
    }

    // Check if the variable type is supported
    const type = this.declaration.getType().getText();
    if (type === "any") {
      this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(type, SUPPORTED_TYPES));
      hasErrors = true;
    }

    if (!SUPPORTED_TYPES.includes(convertType(this.symbolTable, type))) {
      this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(type, SUPPORTED_TYPES));
      hasErrors = true;
    }

    return !hasErrors;
  }
}
