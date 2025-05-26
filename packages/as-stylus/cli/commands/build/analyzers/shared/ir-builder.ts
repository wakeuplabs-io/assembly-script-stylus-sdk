import { ErrorManager } from "./error-manager.js";

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

export abstract class IRBuilder<TResult> {
  constructor(protected readonly errorManager: ErrorManager) {}

  protected abstract validate(): boolean;

  //TODO: Move to error manager and to linter command
  private logErrors() {
    const errors = this.errorManager.getErrors();
    if (errors.length === 0) return;

    console.log('\n'); // Add spacing before errors
    console.log(`${COLORS.blue}=== Linting Results ===${COLORS.reset}\n`);

    errors.forEach((error, index) => {
      const errorType = error.code === 'syntax' ? 
        `${COLORS.red}SYNTAX ERROR${COLORS.reset}` : 
        `${COLORS.yellow}SEMANTIC ERROR${COLORS.reset}`;

      console.log(`${COLORS.gray}[${index + 1}/${errors.length}]${COLORS.reset} ${errorType}`);
      console.log(`${COLORS.gray}Location:${COLORS.reset} ${error.location || 'unknown'}${error.line ? `:${error.line}` : ''}`);
      console.log(`${COLORS.gray}Message:${COLORS.reset} ${error.message}\n`);
    });

    console.log(`${COLORS.blue}=== End of Linting Results ===${COLORS.reset}\n`);
  }

  public validateAndBuildIR(): TResult {
    if (!this.validate()) {
      this.logErrors();
    }

    return this.buildIR();
  }

  protected abstract buildIR(): TResult;
}
