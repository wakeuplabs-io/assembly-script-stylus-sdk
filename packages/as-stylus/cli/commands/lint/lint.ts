import path from "path";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";
import { LintRunner } from "./lint-runner.js";
import { Command } from "commander";

export function runLint() {
  const contractsRoot = path.resolve(process.cwd(), "../contracts");
  const errorManager = new ErrorManager();
  const runner = new LintRunner(contractsRoot, errorManager);
  runner.lint();
}

export const lintCommand = new Command("lint")
  .description("Lint a Stylus contract")
  .action(runLint);
