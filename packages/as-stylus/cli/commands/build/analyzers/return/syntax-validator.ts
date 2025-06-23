import { ReturnStatement } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { SUPPORTED_TYPES } from "../shared/supported-types.js";

const ERROR_MESSAGES = {
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

    const expr = this.statement.getExpression();

    if (expr) {
      const returnType = expr.getType().getText();
      if (!SUPPORTED_TYPES.includes(returnType)) {
        this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(returnType, SUPPORTED_TYPES));
        hasErrors = true;
      }
    }

    return !hasErrors;
  }
}
