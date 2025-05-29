import { MethodDeclaration } from "ts-morph";

import { VISIBILITY_DECORATORS, STATE_MUTABILITY_DECORATORS } from "@/cli/types/abi.types.js";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_NAME: "Method must have a name",
  MISSING_BODY: "Method must have a body",
  MULTIPLE_VISIBILITY_DECORATORS: (decorators: string[]) => `Method has multiple visibility decorators: ${decorators.join(", ")}`,
  MULTIPLE_STATE_MUTABILITY_DECORATORS: (decorators: string[]) => `Method has multiple mutability decorators: ${decorators.join(", ")}`,
} as const;

export class MethodSyntaxValidator extends BaseValidator {
  private method: MethodDeclaration;

  constructor(method: MethodDeclaration, errorManager: ErrorManager) {
    super(errorManager, method.getSourceFile().getFilePath(), method.getStartLineNumber());
    this.method = method;
  }

  validate(): boolean {
    let hasErrors = false;

    if (!this.method.getName()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_NAME);
      hasErrors = true;
    }

    if (!this.method.isAbstract() && !this.method.getBody()) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_BODY);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
