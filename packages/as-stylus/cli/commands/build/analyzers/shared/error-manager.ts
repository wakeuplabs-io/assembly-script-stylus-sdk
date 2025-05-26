import { ValidationError } from "./validation-error.js";

export class ErrorManager {
  private semanticErrors: ValidationError[] = [];
  private syntaxErrors: ValidationError[] = [];

  addSemanticError(message: string, location?: string, line?: number): void {
    this.semanticErrors.push(new ValidationError(message, "semantic", location, line));
  }

  addSyntaxError(message: string, location?: string, line?: number): void {
    this.syntaxErrors.push(new ValidationError(message, "syntax", location, line));
  }

  hasErrors(): boolean {
    return this.semanticErrors.length > 0 || this.syntaxErrors.length > 0;
  }

  getSemanticErrors(): ValidationError[] {
    return this.semanticErrors;
  }

  getSyntaxErrors(): ValidationError[] {
    return this.syntaxErrors;
  }

  getErrors(): ValidationError[] {
    return [...this.semanticErrors, ...this.syntaxErrors];
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const errorMessages = this.getErrors()
        .map((error) => {
          let locationInfo = error.location ? ` at ${error.location}` : "";
          locationInfo += error.line ? `:${error.line}` : "";
          return `[${error.code}] ${error.message}${locationInfo}`;
        })
        .join("\n");
      throw new Error(errorMessages);
    }
  }
}
