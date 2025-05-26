import { ReturnStatement } from "ts-morph";

import { BaseValidator } from "../shared/base-validator.js";
import { ErrorManager } from "../shared/error-manager.js";

export class ReturnSyntaxValidator extends BaseValidator {
  private statement: ReturnStatement;
  private filePath: string;

  constructor(statement: ReturnStatement, errorManager: ErrorManager) {
    super(errorManager);
    this.statement = statement;
    this.filePath = statement.getSourceFile().getFilePath();
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
        this.errorManager.addSyntaxError(
          `Unsupported return type: ${returnType}. Supported types are: ${supportedTypes.join(", ")}`,
          this.filePath,
          this.statement.getEndLineNumber(),
        );
        hasErrors = true;
      }
    } catch (error) {
      this.errorManager.addSyntaxError(
        "Return statement must have an expression",
        this.filePath,
        this.statement.getEndLineNumber(),
      );
      hasErrors = true;
    }

    return !hasErrors;
  }
}
