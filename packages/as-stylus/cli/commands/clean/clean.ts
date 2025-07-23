import { Command } from "commander";
import path from "path";

import { CleanRunner } from "./clean-runner.js";

export function runClean() {
  const contractsRoot = path.resolve(process.cwd());
  const runner = new CleanRunner(contractsRoot);
  runner.clean();
}

export const cleanCommand = new Command("clean")
  .description("Remove build artifacts and temporary files")
  .action(runClean);
