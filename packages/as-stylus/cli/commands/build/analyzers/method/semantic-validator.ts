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

export class MethodSemanticValidator extends BaseValidator {
  private method: MethodDeclaration;

  constructor(method: MethodDeclaration, errorManager: ErrorManager) {
    super(errorManager, method.getSourceFile().getFilePath(), method.getStartLineNumber());
    this.method = method;
  }

  validate(): boolean {
    let hasErrors = false;

    const decorators = this.method.getDecorators();
    const visDecorators = decorators.filter((d) => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter((d) =>
      STATE_MUTABILITY_DECORATORS.includes(d.getName()),
    );

    if (visDecorators.length > 1) {
      this.addSemanticError(ERROR_MESSAGES.MULTIPLE_VISIBILITY_DECORATORS(visDecorators.map((d) => d.getName())));
      hasErrors = true;
    }

    if (stateDecorators.length > 1) {
      this.addSemanticError(ERROR_MESSAGES.MULTIPLE_STATE_MUTABILITY_DECORATORS(stateDecorators.map((d) => d.getName())));
      hasErrors = true;
    }

    return !hasErrors;
  }
}
