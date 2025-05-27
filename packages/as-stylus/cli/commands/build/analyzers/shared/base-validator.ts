import { ErrorManager } from "./error-manager.js";

export abstract class BaseValidator {
  constructor(protected readonly errorManager: ErrorManager, protected readonly filePath: string, protected readonly line: number) {}

  abstract validate(): boolean;

  protected addSyntaxError(code: string): void {
    this.errorManager.addSyntaxError(code, this.filePath, this.line);
  }

  protected addSemanticError(code: string, args?: string[]): void {
    this.errorManager.addSemanticError(code, this.filePath, this.line, args);
  }
}
