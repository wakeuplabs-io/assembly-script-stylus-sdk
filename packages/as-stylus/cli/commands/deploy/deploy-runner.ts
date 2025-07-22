import { ProjectFinder } from "@/cli/services/project-finder.js";
import { runCommand } from "@/cli/utils/command-runner.js";
import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";

import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export class DeployRunner {
  private projectFinder: ProjectFinder;

  constructor(contractsRoot: string, errorManager: ErrorManager) {
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  deploy(contractPath: string, options: { privateKey: string; endpoint: string }) {
    const projectTargetPath = this.projectFinder.getProjectBuildPath();
    const contractName = this.projectFinder.getContractName(contractPath);

    //TODO: save the wasm file with the name of the contract
    const command = `cargo stylus deploy --wasm-file ${BUILD_WASM_PATH}/${contractName}.wasm --private-key ${options.privateKey} --endpoint ${options.endpoint}`;

    return runCommand(command, {
      cwd: projectTargetPath,
      successMessage: "Deployment completed successfully",
      errorMessage: "Deployment failed",
    });
  }
}
