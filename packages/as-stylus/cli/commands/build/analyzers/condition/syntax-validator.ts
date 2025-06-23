import { Expression } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";

export class ConditionSyntaxValidator extends BaseValidator {
  constructor(expression: Expression) {
    super(expression);
  }

  validate(): boolean {
    //TODO: implement validation
    const hasErrors = false;  

    return !hasErrors;
  }
}