import { MethodDeclaration } from "ts-morph";
import { BaseValidator } from "../shared/base-validator";
import { VISIBILITY_DECORATORS, STATE_MUTABILITY_DECORATORS } from "@/cli/types/abi.types.js";
import { ErrorManager } from "../shared/error-manager";

export class MethodSyntaxValidator extends BaseValidator {
  private method: MethodDeclaration;

  constructor(method: MethodDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.method = method;
  }

  validate(): boolean {
    let hasErrors = false;

    if (!this.method.getName()) {
      this.errorManager.addSyntaxError(
        "Method must have a name",
        this.method.getSourceFile().getFilePath(),
        this.method.getStartLineNumber()
      );
      hasErrors = true;
    }

    if (!this.method.isAbstract() && !this.method.getBody()) {
      this.errorManager.addSyntaxError(
        `Method "${this.method.getName()}" must have a body`,
        this.method.getSourceFile().getFilePath(),
        this.method.getStartLineNumber()
      );
      hasErrors = true;
    }

    const decorators = this.method.getDecorators();
    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));

    if (visDecorators.length > 1) {
      this.errorManager.addSemanticError(
        `Method "${this.method.getName()}" has multiple visibility decorators: ${visDecorators.map(d => d.getName()).join(", ")}`,
        this.method.getSourceFile().getFilePath(),
        this.method.getStartLineNumber()
      );
      hasErrors = true;
    }

    if (stateDecorators.length > 1) {
      this.errorManager.addSemanticError(
        `Method "${this.method.getName()}" has multiple mutability decorators: ${stateDecorators.map(d => d.getName()).join(", ")}`,
        this.method.getSourceFile().getFilePath(),
        this.method.getStartLineNumber()
      );
      hasErrors = true;
    }

    return !hasErrors;
  }
}