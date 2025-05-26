export type ErrorCode = "info" | "warn" | "error" | "debug" | "syntax" | "semantic" | "unknown";

export class ValidationError {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode,
    public readonly location?: string,
    public readonly line?: number,
  ) {}

  log() {
    console.log(
      `[${this.code}] ${this.message}${this.location ? ` at line ${this.line} of ${this.location}` : ""}`,
    );
  }
}
