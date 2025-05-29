import { ValidationError } from "./validation-error.js";
import SEMANTIC_ERRORS from "../../errors/semantic-list.js";
import SYNTACTIC_ERRORS from "../../errors/syntactic-list.js";

export class ErrorManager {
  private semanticErrors: ValidationError[] = [];
  private syntaxErrors: ValidationError[] = [];

  addSemanticError(code: string, location?: string, line?: number, args?: string[]): void {
    // TODO: remove this once we have a proper error message
    const message = SEMANTIC_ERRORS[code]?.message(args ?? []) ?? code;
    this.semanticErrors.push(new ValidationError(message, code, "semantic", location, line));
  }

  addSyntaxError(code: string, location?: string, line?: number, args?: string[]): void {
    // TODO: remove this once we have a proper error message
    const message = SYNTACTIC_ERRORS[code]?.message(args ?? []) ?? code;
    this.syntaxErrors.push(new ValidationError(message, code, "syntax", location, line));
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
          return `[${error.level}] ${error.message}${locationInfo}`;
        })
        .join("\n");
      throw new Error(errorMessages);
    }
  }
}
