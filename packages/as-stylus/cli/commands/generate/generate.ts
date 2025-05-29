import { Command } from "commander";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";
import { GenerateRunner } from "./generate-runner.js";

export function runGenerate(projectName: string) {
  const contractsRoot = process.cwd();
  const errorManager = new ErrorManager();
  const runner = new GenerateRunner(contractsRoot, errorManager, projectName);
  runner.validateAndGenerate();
}

export const generateCommand = new Command("generate")
  .description("Generate a new Stylus project")
  .argument("<project-name>", "Name of the project to generate")
  .action((projectName: string) => {
    runGenerate(projectName);
  });
