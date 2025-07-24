import { Command } from "commander";
import path from "path";

import { CompileRunner } from "./compile-runner.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export function runCompile(contractPath: string) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new CompileRunner(contractsRoot, contractPath, errorManager);
  runner.validate();
  runner.compile();
}

export const compileCommand = new Command("compile")
  .description("Compile an AssemblyScript Contract")
  .argument("<contract-path>", "Path to the contract file")
  .action((contractPath: string) => {
    runCompile(contractPath);
  });
