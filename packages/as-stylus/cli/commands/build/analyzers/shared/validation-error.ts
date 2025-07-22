export type LevelCode = "info" | "warn" | "error" | "debug" | "syntax" | "semantic" | "unknown";

export class ValidationError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly level: LevelCode,
    public readonly location?: string,
    public readonly line?: number,
  ) {}

  log() {
    console.log(
      `[${this.level}] ${this.message}${this.location ? ` at line ${this.line} of ${this.location}` : ""}`,
    );
  }
}
