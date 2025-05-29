import path from "path";
import { Command } from 'commander';

import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { BuildRunner } from "./build-runner.js";
import { BUILD_PATH } from "@/cli/utils/constants.js";

export function runBuild() {
  const contractsRoot = path.resolve(process.cwd());
  const errorManager = new ErrorManager();
  const runner = new BuildRunner(contractsRoot, BUILD_PATH, errorManager);
  runner.validateAndBuildIR();
}

export const buildCommand = new Command('build')
  .description('Build a Stylus project')
  .action(runBuild);
