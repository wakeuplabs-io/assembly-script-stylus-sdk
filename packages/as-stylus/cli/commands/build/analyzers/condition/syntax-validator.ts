import { Expression } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ConditionSyntaxValidator extends BaseValidator {

  constructor(expression: Expression, errorManager: ErrorManager) {
    super(errorManager, expression.getSourceFile().getFilePath(), expression.getStartLineNumber());
  }

  validate(): boolean {
    //TODO: implement validation
    const hasErrors = false;  

    return !hasErrors;
  }
}