import { Command } from 'commander';
import path from "path";

import { ErrorManager } from './analyzers/shared/error-manager.js';
import { BuildRunner } from "./build-runner.js";
import { buildProject } from './builder/index.js';
import { mixInheritance } from './builder/mix-inheritance.js';
import { transformFromIR } from './transformers/index.js';

export function runBuild(contractPath: string) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new BuildRunner(contractsRoot, contractPath, errorManager);
  runner.validate();
  const contract = runner.buildIR();

  const contractWithParents = mixInheritance(contract.ir, contract.ir.parent);
  buildProject(contract.transformedPath, contractWithParents, []);
  transformFromIR(contract.projectTargetPath, contractWithParents);
}

export const buildCommand = new Command('build')
  .description('Build a Stylus project')
  .argument('<contract-path>', 'Path to the contracts root')
  .action((contractPath: string) => {
    runBuild(contractPath);
  });
