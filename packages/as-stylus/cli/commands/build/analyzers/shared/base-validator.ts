import { ErrorManager } from "./error-manager.js";

export abstract class BaseValidator {
  constructor(protected readonly errorManager: ErrorManager, protected readonly filePath: string, protected readonly line: number) {}

  abstract validate(): boolean;

  protected addSyntaxError(message: string): void {
    this.errorManager.addSyntaxError(message, this.filePath, this.line);
  }

  protected addSemanticError(message: string): void {
    this.errorManager.addSemanticError(message, this.filePath, this.line);
  }
}
