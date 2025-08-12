import { Command } from "commander";
import path from "path";

import { BUILD_PATH } from "@/cli/utils/constants.js";
import { getCurrentWorkingDirectory } from "@/cli/utils/fs.js";

import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { BuildRunner } from "./build-runner.js";
import { buildProject } from "./builder/index.js";
import { mixInheritance } from "./builder/mix-inheritance.js";
import { transformFromIR } from "./transformers/index.js";

export function runBuild(projectTargetPath: string, contractPath: string) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new BuildRunner(contractsRoot, contractPath, errorManager);
  runner.validate();
  const contract = runner.buildIR(projectTargetPath);

  const contractWithParents = mixInheritance(contract.ir, contract.ir.parent);
  buildProject(contract.transformedPath, contractWithParents, []);
  transformFromIR(contract.projectTargetPath, contractWithParents);
}

export const buildCommand = new Command("build")
  .description("Build a Stylus project")
  .argument("<contract-path>", "Path to the contract file")
  .action((contractPath: string) => {
    const projectTargetPath = path.resolve(getCurrentWorkingDirectory(), BUILD_PATH);
    runBuild(projectTargetPath, contractPath);
  });
