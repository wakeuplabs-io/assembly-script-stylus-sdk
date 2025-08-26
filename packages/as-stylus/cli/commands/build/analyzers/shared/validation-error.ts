import { ErrorCode } from "@/cli/utils/error-codes.js";

export type LevelCode = "info" | "warn" | "error" | "debug" | "syntax" | "semantic" | "unknown";

export class ValidationError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly level: LevelCode,
    public readonly location?: string,
    public readonly line?: number,
    public readonly numericCode?: ErrorCode,
  ) {}

  log() {
    const codeInfo = this.numericCode ? `[${this.numericCode}]` : `[${this.level}]`;
    console.log(
      `${codeInfo} ${this.message}${this.location ? ` at line ${this.line} of ${this.location}` : ""}`,
    );
  }
}
