import { MethodDeclaration } from "ts-morph";

import { VISIBILITY_DECORATORS, STATE_MUTABILITY_DECORATORS } from "@/cli/types/abi.types.js";

import { ERROR_CODES } from "../../errors/codes.js";
import { BaseValidator } from "../shared/base-validator.js";
import { SUPPORTED_TYPES } from "../shared/supported-types.js";

export class MethodSemanticValidator extends BaseValidator {
  private method: MethodDeclaration;
  private allNameMethods: string[];

  constructor(method: MethodDeclaration, allNameMethods: string[]) {
    super(method);
    this.method = method;
    this.allNameMethods = allNameMethods;
  }

  validate(): boolean {
    let hasErrors = false;

    const decorators = this.method.getDecorators();
    const visDecorators = decorators.filter((d) => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter((d) =>
      STATE_MUTABILITY_DECORATORS.includes(d.getName()),
    );

    if (visDecorators.length > 1) {
      this.addSemanticError(ERROR_CODES.MULTIPLE_VISIBILITY_DECORATORS_FOUND, [visDecorators.map((d) => d.getName()).join(", ")]);
      hasErrors = true;
    }

    if (stateDecorators.length > 1) {
      this.addSemanticError(ERROR_CODES.MULTIPLE_STATE_MUTABILITY_DECORATORS_FOUND, [stateDecorators.map((d) => d.getName()).join(", ")]);
      hasErrors = true;
    }

    const returnType = this.method.getReturnType();
    if (returnType && !SUPPORTED_TYPES.includes(returnType.getText())) {
      this.addSemanticError(ERROR_CODES.INVALID_RETURN_TYPE, [this.method.getName()]);
      hasErrors = true;
    }

    if (this.method.getName() && this.allNameMethods.filter((name) => name === this.method.getName())?.length > 1) {
      this.addSemanticError(ERROR_CODES.METHOD_NAME_ALREADY_EXISTS, [this.method.getName()]);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
