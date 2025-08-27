import { LevelCode, ValidationError } from "../commands/build/analyzers/shared/validation-error.js";
import { ErrorTemplate } from "../utils/error-messages.js";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

const ERROR_TYPES: Record<LevelCode, { color: string; label: string }> = {
  error: { color: COLORS.red, label: "ERROR" },
  warn: { color: COLORS.yellow, label: "WARNING" },
  info: { color: COLORS.blue, label: "INFO" },
  debug: { color: COLORS.gray, label: "DEBUG" },
  syntax: { color: COLORS.red, label: "SYNTAX ERROR" },
  semantic: { color: COLORS.yellow, label: "SEMANTIC ERROR" },
  unknown: { color: COLORS.gray, label: "UNKNOWN ERROR" },
} as const;

export class Logger {
  private static instance: Logger;
  private isDebugMode: boolean = false;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  public info(message: string): void {
    this.log(message, "info");
  }

  public warn(message: string): void {
    this.log(message, "warn");
  }

  public error(message: string, location?: string, line?: number): void {
    this.log(message, "error", location, line);
  }

  public debug(message: string): void {
    if (this.isDebugMode) {
      this.log(message, "debug");
    }
  }

  public logActionableError(template: ErrorTemplate): void {
    console.log(`\n${COLORS.red}${COLORS.bold}❌ ${template.title}${COLORS.reset}`);
    console.log(`\n${COLORS.gray}📝 Problem:${COLORS.reset}`);
    console.log(`   ${template.description}`);
    console.log(`\n${COLORS.green}💡 Solution:${COLORS.reset}`);
    console.log(`   ${template.solution}`);

    if (template.moreInfo) {
      console.log(`\n${COLORS.cyan}ℹ️  More Info:${COLORS.reset}`);
      console.log(`   ${template.moreInfo}`);
    }
    console.log();
  }

  public logSuccess(message: string): void {
    console.log(`${COLORS.green}✅ ${message}${COLORS.reset}`);
  }

  public logWarning(message: string, suggestion?: string): void {
    console.log(`${COLORS.yellow}⚠️  Warning: ${message}${COLORS.reset}`);
    if (suggestion) {
      console.log(`${COLORS.gray}   Suggestion: ${suggestion}${COLORS.reset}`);
    }
  }

  public logProgress(step: string, current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    console.log(`${COLORS.blue}[${current}/${total}] (${percentage}%) ${step}${COLORS.reset}`);
  }

  public logErrorList(errors: ValidationError[]): void {
    if (errors.length === 0) return;

    console.log("\n");
    console.log(`${COLORS.blue}=== Linting Results ===${COLORS.reset}\n`);

    errors.forEach((error, index) => {
      const errorType = this.getErrorType(error);
      const location = error.location || "unknown";
      const line = error.line;
      const message = error.message;

      console.log(`${COLORS.gray}[${index + 1}/${errors.length}]${COLORS.reset} ${errorType}`);
      console.log(`${COLORS.gray}Location:${COLORS.reset} ${location}${line ? `:${line}` : ""}`);
      console.log(`${COLORS.gray}Message:${COLORS.reset} ${message}\n`);
    });

    console.log(`${COLORS.blue}=== End of Linting Results ===${COLORS.reset}\n`);
  }

  private getErrorType(error: ValidationError, level?: LevelCode): string {
    const errorType = level || error.level;
    const { color, label } = ERROR_TYPES[errorType] || ERROR_TYPES.unknown;
    return `${color}${label}${COLORS.reset}`;
  }

  private log(message: string, level: LevelCode, location?: string, line?: number): void {
    const timestamp = new Date().toISOString();
    const color = ERROR_TYPES[level]?.color || COLORS.reset;

    const locationPath = location ? ` [${location}${line ? `:${line}` : ""}]` : "";

    if (level === "error" && message.includes("❌")) {
      console.log(message);
    } else {
      console.log(
        `${COLORS.gray}[${timestamp}]${COLORS.reset} ${color}${level}${COLORS.reset}${locationPath} ${message}`,
      );
    }
  }
}
