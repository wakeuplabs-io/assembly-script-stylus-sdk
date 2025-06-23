import { Command } from 'commander';
import path from "path";

import { BUILD_PATH } from "@/cli/utils/constants.js";

import { ErrorManager } from './analyzers/shared/error-manager.js';
import { BuildRunner } from "./build-runner.js";

export function runBuild() {
  const contractsRoot = path.resolve(process.cwd());
  const errorManager = new ErrorManager();
  const runner = new BuildRunner(contractsRoot, BUILD_PATH, errorManager);
  runner.validate();
  runner.buildIR();
}

export const buildCommand = new Command('build')
  .description('Build a Stylus project')
  .action(runBuild);
