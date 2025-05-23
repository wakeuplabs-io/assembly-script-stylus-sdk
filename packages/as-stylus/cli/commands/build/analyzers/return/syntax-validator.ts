import { ReturnStatement } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

const ERROR_MESSAGES = {
  MISSING_EXPRESSION: "Return statement must have an expression",
  UNSUPPORTED_TYPE: (type: string, supportedTypes: string[]) => `Unsupported return type: ${type}. Supported types are: ${supportedTypes.join(", ")}`,
} as const;

export class ReturnSyntaxValidator extends BaseValidator {
  private statement: ReturnStatement;

  constructor(statement: ReturnStatement, errorManager: ErrorManager) {
    super(errorManager, statement.getSourceFile().getFilePath(), statement.getStartLineNumber());
    this.statement = statement;
  }

  validate(): boolean {
    let hasErrors = false;

    try {
      // Check if the return statement has an expression
      const expr = this.statement.getExpressionOrThrow();

      // Check if the return type is supported
      const returnType = expr.getType().getText();
      // TODO: Add types in other place
      const supportedTypes = ["U256", "string", "boolean", "address", "void"];
      if (!supportedTypes.includes(returnType)) {
        this.addSyntaxError(ERROR_MESSAGES.UNSUPPORTED_TYPE(returnType, supportedTypes));
        hasErrors = true;
      }
    } catch (error) {
      this.addSyntaxError(ERROR_MESSAGES.MISSING_EXPRESSION);
      hasErrors = true;
    }

    return !hasErrors;
  }
}
