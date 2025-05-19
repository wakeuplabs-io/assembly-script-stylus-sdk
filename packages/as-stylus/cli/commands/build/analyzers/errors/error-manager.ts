export class ValidationError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly location?: string,
    public readonly line?: number
  ) {}

  log() {
    console.log(`[${this.code}] ${this.message}${this.location ? ` at line ${this.line} of ${this.location}` : ''}`);
  }
}

export class ErrorManager {
  private errors: ValidationError[] = [];

  addError(message: string, code: string, location?: string, line?: number): void {
    this.errors.push(new ValidationError(message, code, location, line));
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const errorMessages = this.errors
        .map(error => {
          let locationInfo = error.location ? ` at ${error.location}` : '';
          locationInfo += error.line ? `:${error.line}` : '';
          return `[${error.code}] ${error.message}${locationInfo}`;
        })
        .join('\n');
      throw new Error(errorMessages);
    }
  }
} 