import { VariableDeclaration } from "ts-morph";
import { ErrorManager } from "../shared/error-manager";
import { BaseValidator } from "../shared/base-validator";

export class VariableSyntaxValidator extends BaseValidator {
  private filePath: string;

  constructor(
    private declaration: VariableDeclaration,
    errorManager: ErrorManager
  ) {
    super(errorManager);
    this.filePath = declaration.getSourceFile().getFilePath();
  }

  validate(): boolean {
    let hasErrors = false;
    // Check if the variable has an initializer
    if (!this.declaration.hasInitializer()) {
      this.errorManager.addSyntaxError(
        "Variable declaration must have an initializer",
        this.filePath,
        this.declaration.getEndLineNumber()
      );
      hasErrors = true;
    }

    // Check if the variable name is valid
    const name = this.declaration.getName();
    if (!name || name.trim() === "") {
      this.errorManager.addSyntaxError(
        "Variable must have a valid name",
        this.filePath,
        this.declaration.getEndLineNumber()
      );
      hasErrors = true;
    }

    // Check if the variable type is supported
    const type = this.declaration.getType().getText();
    const supportedTypes = ["U256", "string", "boolean", "address"];
    if (!supportedTypes.includes(type)) {
      this.errorManager.addSyntaxError(
        `Unsupported variable type: ${type}. Supported types are: ${supportedTypes.join(", ")}`,
        this.filePath,
        this.declaration.getEndLineNumber()
      );
      hasErrors = true;
    }

    return !hasErrors;
  }
} 