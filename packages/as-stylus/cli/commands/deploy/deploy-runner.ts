import { execSync } from "child_process";

import { Logger } from "@/cli/services/logger.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";
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

  deploy(options: { privateKey: string; endpoint: string }): void {
    const projectTargetPath = this.projectFinder.getProjectBuildPath();

    //TODO: save the wasm file with the name of the contract
    const command = `cargo stylus deploy --wasm-file ${BUILD_WASM_PATH}/module.wasm --private-key ${options.privateKey} --endpoint ${options.endpoint}`;

    try {
      Logger.getInstance().info(`Running: ${command}`);
      execSync(command, {
        cwd: projectTargetPath,
        stdio: "inherit",
      });
      Logger.getInstance().info("AssemblyScript checker completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`AssemblyScript checker failed: ${message}`);
    }
  }
}
