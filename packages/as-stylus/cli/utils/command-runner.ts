import { execSync } from "child_process";

import { Logger } from "@/cli/services/logger.js";
import { findErrorTemplate, createErrorMessage } from "@/cli/utils/error-messages.js";

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

function parseCargoStylusError(rawError: string): string {
  const stderrMatch = rawError.match(/Command failed:.*?stderr:\s*([\s\S]*?)(?:\n\s*$|$)/i);
  const errorText = stderrMatch ? stderrMatch[1].trim() : rawError;

  const template = findErrorTemplate(errorText);
  if (template) {
    return createErrorMessage(template);
  }

  const enhancedError = createErrorMessage({
    title: "Cargo Stylus Error",
    description: errorText.slice(0, 200) + (errorText.length > 200 ? "..." : ""),
    solution:
      "Check the error details and fix the issues in your contract or deployment parameters",
    moreInfo:
      "Common issues: insufficient funds, invalid private key format, network connectivity, or contract compilation errors",
  });

  return enhancedError;
}

function isCargoStylusCommand(command: string): boolean {
  return command.includes("cargo stylus");
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

    if (isCargoStylusCommand(command)) {
      const actionableError = parseCargoStylusError(message);
      throw new Error(actionableError);
    }

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
