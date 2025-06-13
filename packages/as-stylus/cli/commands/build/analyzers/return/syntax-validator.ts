import { ReturnStatement } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { SUPPORTED_TYPES } from "../shared/supported-types.js";

const ERROR_MESSAGES = {
  MISSING_EXPRESSION: "Return statement must have an expression",
  UNSUPPORTED_TYPE: (type: string, supportedTypes: string[]) => `Unsupported return type: ${type}. Supported types are: ${supportedTypes.join(", ")}`,
} as const;

export class ReturnSyntaxValidator extends BaseValidator {
  private statement: ReturnStatement;

  constructor(statement: ReturnStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    let hasErrors = false;

    try {
      // Check if the return statement has an expression
      const expr = this.statement.getExpressionOrThrow();

      // Check if the return type is supported
      const returnType = expr.getType().getText();
      if (!SUPPORTED_TYPES.includes(returnType)) {
        this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(returnType, SUPPORTED_TYPES ));
        hasErrors = true;
      }
    } catch (error) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_EXPRESSION);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
