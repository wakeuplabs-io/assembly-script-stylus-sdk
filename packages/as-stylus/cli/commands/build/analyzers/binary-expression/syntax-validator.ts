import { BinaryExpression, Expression } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ARITHMETIC_OPERATORS, CONDITIONAL_OPERATORS } from "../shared/supported-types.js";

const ERROR_MESSAGES = {
  MISSING_LEFT_OR_RIGHT_EXPRESSION: "Missing left or right expression",
  INVALID_OPERATOR: (op: string) => `Invalid operator: ${op}`,
};

export class BinaryExpressionSyntaxValidator extends BaseValidator {
  private left: Expression;
  private right: Expression;
  private op: string;
  private isConditional: boolean;

  constructor(expression: BinaryExpression, isConditional: boolean = false) {
    super(expression);
    this.left = expression.getLeft() as Expression;
    this.right = expression.getRight() as Expression;
    this.op = expression.getOperatorToken().getText();
    this.isConditional = isConditional;
  }

  validate(): boolean {
    let hasErrors = false;
    if (!this.left || !this.right) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_LEFT_OR_RIGHT_EXPRESSION);
      hasErrors = true;
    }

    if (this.isConditional) {
      if (!CONDITIONAL_OPERATORS.includes(this.op)) {
        this.addSyntaxError(ERROR_MESSAGES.INVALID_OPERATOR(this.op));
        hasErrors = true;
      }
    } else {
      if (![...CONDITIONAL_OPERATORS, ...ARITHMETIC_OPERATORS].includes(this.op)) {
        this.addSyntaxError(ERROR_MESSAGES.INVALID_OPERATOR(this.op));
        hasErrors = true;
      }
    }

    return !hasErrors;
  }
}
