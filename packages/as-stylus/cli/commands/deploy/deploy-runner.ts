import { ProjectFinder } from "@/cli/services/project-finder.js";
import { runCommand } from "@/cli/utils/command-runner.js";
import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import { findErrorTemplate } from "@/cli/utils/error-messages.js";
import { ErrorCode, createAStylusError } from "@/cli/utils/global-error-handler.js";
import { ValidationUtils } from "@/cli/utils/validation.js";

import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export class DeployRunner {
  private projectFinder: ProjectFinder;

  constructor(contractsRoot: string, errorManager: ErrorManager) {
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  deploy(contractPath: string, options: { privateKey: string; endpoint?: string }) {
    const projectTargetPath = this.projectFinder.getProjectBuildPath();
    const contractName = this.projectFinder.getContractName(contractPath);

    const defaultEndpoint = "https://sepolia-rollup.arbitrum.io/rpc";
    const rpcEndpoint = options.endpoint || defaultEndpoint;

    const keyValidation = ValidationUtils.validatePrivateKey(options.privateKey);
    if (!keyValidation.isValid) {
      const error = createAStylusError(
        keyValidation.code || ErrorCode.INVALID_PRIVATE_KEY_FORMAT,
        keyValidation.message,
      );
      throw error;
    }

    const command = `cargo stylus deploy --wasm-file ${BUILD_WASM_PATH}/${contractName}.wasm --private-key ${options.privateKey} --endpoint ${rpcEndpoint}`;

    try {
      return runCommand(command, {
        cwd: projectTargetPath,
        stdio: "pipe",
        successMessage: "Deployment completed successfully",
        errorMessage: "Deployment failed",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const template = findErrorTemplate(errorMessage);

      if (template) {
        const enhancedError = createAStylusError(
          ErrorCode.CARGO_STYLUS_ERROR,
          errorMessage,
          error instanceof Error ? error : undefined,
        );
        throw enhancedError;
      } else {
        const deploymentError = createAStylusError(
          ErrorCode.CONTRACT_DEPLOYMENT_FAILED,
          errorMessage,
          error instanceof Error ? error : undefined,
        );
        throw deploymentError;
      }
    }
  }
}
