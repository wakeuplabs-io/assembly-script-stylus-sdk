import { MethodDeclaration } from "ts-morph";

import { VISIBILITY_DECORATORS, STATE_MUTABILITY_DECORATORS } from "@/cli/types/abi.types.js";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { SUPPORTED_TYPES } from "../shared/supported-types.js";

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
      this.addSemanticError("S005", [visDecorators.map((d) => d.getName()).join(", ")]);
      hasErrors = true;
    }

    if (stateDecorators.length > 1) {
      this.addSemanticError("S006", [stateDecorators.map((d) => d.getName()).join(", ")]);
      hasErrors = true;
    }

    const returnType = this.method.getReturnType();
    if (returnType && !SUPPORTED_TYPES.includes(returnType.getText())) {
      this.addSemanticError("S007", [this.method.getName()]);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
