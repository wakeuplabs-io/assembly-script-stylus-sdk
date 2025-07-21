import { Command } from "commander";
import path from "path";

import { DeployRunner } from "./deploy-runner.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export function runDeploy(
  _contractPath: string,
  options: { privateKey: string; endpoint: string },
) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new DeployRunner(contractsRoot, errorManager);
  runner.validate();
  runner.deploy(options);
}

export const deployCommand = new Command("deploy")
  .description("Deploy an AssemblyScript Contract")
  .argument("<contract-path>", "Path to the contracts root")
  .option("--private-key <private-key>", "Private key to deploy the contract")
  .option("--endpoint <endpoint>", "Endpoint to deploy the contract")
  .action((contractPath: string, options: { privateKey: string; endpoint: string }) => {
    runDeploy(contractPath, options);
  });
