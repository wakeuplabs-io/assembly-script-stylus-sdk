import { Command } from "commander";
import path from "path";

import { CompileRunner } from "./compile-runner.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export function runCompile(contractPath: string, endpoint?: string) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new CompileRunner(contractsRoot, contractPath, errorManager);
  runner.validate();
  runner.compile(endpoint);
}

export const compileCommand = new Command("compile")
  .description("Compile an AssemblyScript Contract")
  .argument("<contract-path>", "Path to the contract file")
  .option("--endpoint <endpoint>", "Endpoint to use for the compiler")
  .action((contractPath: string, options: { endpoint?: string }) => {
    runCompile(contractPath, options.endpoint);
  });
