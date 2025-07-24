import { execSync } from "child_process";

import { Logger } from "@/cli/services/logger.js";

export interface RunCommandOptions {
  cwd?: string;
  stdio?: "inherit" | "pipe" | "ignore";
  encoding?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface RunFunctionOptions {
  infoMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function runCommand(command: string, options: RunCommandOptions = {}) {
  const { cwd, stdio = "inherit", successMessage, errorMessage } = options;

  try {
    Logger.getInstance().info(`Running: ${command}`);
    let output: string | Buffer = "";
    if (command) {
      output = execSync(command, {
        cwd,
        stdio,
      });
    }

    if (successMessage) {
      Logger.getInstance().info(successMessage);
    }
    return output ? output.toString() : "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorPrefix = errorMessage || "Command execution failed";
    throw new Error(`${errorPrefix}: ${message}`);
  }
}

export function runFunction(func: () => void, options: RunFunctionOptions = {}): void {
  const { infoMessage, successMessage, errorMessage } = options;

  try {
    if (infoMessage) {
      Logger.getInstance().info(infoMessage);
    }

    func();

    if (successMessage) {
      Logger.getInstance().info(successMessage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorPrefix = errorMessage || "Command execution failed";
    throw new Error(`${errorPrefix}: ${message}`);
  }
}
