import { execSync } from "child_process";

import { Logger } from "@/cli/services/logger.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";
import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";

import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export class CompileRunner {
  private projectFinder: ProjectFinder;
  private contractPath: string;

  constructor(contractsRoot: string, contractPath: string, errorManager: ErrorManager) {
    this.contractPath = contractPath;
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  private runAssemblyScriptCompiler(projectTargetPath: string, contractName: string): void {
    const command = `npx asc ${contractName}.entrypoint.ts --config asconfig.json`;

    try {
      Logger.getInstance().info(`Running: ${command}`);
      execSync(command, {
        cwd: projectTargetPath,
        stdio: "inherit",
      });
      Logger.getInstance().info("AssemblyScript compilation completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`AssemblyScript compilation failed: ${message}`);
    }
  }

  private runAssemblyScriptChecker(projectTargetPath: string): void {
    //TODO: save the wasm file with the name of the contract
    const command = `cargo stylus check --wasm-file ${BUILD_WASM_PATH}/module.wasm`;

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

  compile(): void {
    const projectTargetPath = this.projectFinder.getProjectBuildPath();
    const contractName = this.projectFinder.getContractName(this.contractPath);

    this.runAssemblyScriptCompiler(projectTargetPath, contractName);
    this.runAssemblyScriptChecker(projectTargetPath);
  }
}
