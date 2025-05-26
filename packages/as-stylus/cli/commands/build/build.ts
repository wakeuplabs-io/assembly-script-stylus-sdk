import path from "path";

import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { BuildRunner } from "./build-runner.js";

export function runBuild() {
  const contractsRoot = path.resolve(process.cwd(), "../contracts");
  const errorManager = new ErrorManager();
  const runner = new BuildRunner(contractsRoot, errorManager);
  runner.validateAndBuildIR();
}

runBuild();
