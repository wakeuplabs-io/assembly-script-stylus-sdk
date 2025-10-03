import path from "path";

import { ProjectFinder } from "@/cli/services/project-finder.js";
import { runCommand, runFunction } from "@/cli/utils/command-runner.js";
import { BUILD_PATH, BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import { getCurrentWorkingDirectory } from "@/cli/utils/fs.js";
import { createAStylusError, ErrorCode } from "@/cli/utils/global-error-handler.js";

import { ErrorManager } from "../build/analyzers/shared/error-manager.js";
import { runBuild } from "../build/build.js";

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

  private runBuild(): void {
    runFunction(
      () => {
        const cwd = getCurrentWorkingDirectory();
        const projectTargetPath = path.resolve(cwd, BUILD_PATH);
        runBuild(projectTargetPath, this.contractPath);
      },
      {
        infoMessage: "Running build",
        successMessage: "Build completed successfully",
        errorMessage: "Build failed",
      },
    );
  }

  private runTypeScriptChecker(projectTargetPath: string, contractName: string): void {
    try {
      const command = `npx tsc ${contractName}.ts --noEmit --skipLibCheck`;

      runCommand(command, {
        cwd: projectTargetPath,
        successMessage: "TypeScript type checking completed successfully",
        errorMessage: "TypeScript type checking failed",
      });
    } catch (error) {
      const commandError = createAStylusError(
        ErrorCode.SYNTAX_ERROR,
        "TypeScript type checking failed",
        error instanceof Error ? error : undefined,
      );
      throw commandError;
    }
  }

  private runEslintChecker(projectTargetPath: string, contractName: string): void {
    try {
      const command = `npx eslint ${contractName}.ts --ext .ts`;

      runCommand(command, {
        cwd: projectTargetPath,
        successMessage: "Eslint type checking completed successfully",
        errorMessage: "Eslint type checking failed",
      });
    } catch (error) {
      const commandError = createAStylusError(
        ErrorCode.SYNTAX_ERROR,
        "Eslint type checking failed",
        error instanceof Error ? error : undefined,
      );
      throw commandError;
    }
  }

  private runAssemblyScriptCompiler(projectTargetPath: string, contractName: string): void {
    const command = `npx asc ${contractName}.entrypoint.ts --outFile ${BUILD_WASM_PATH}/${contractName}.wasm --textFile ${BUILD_WASM_PATH}/${contractName}.wat --optimizeLevel 3 --shrinkLevel 2`;

    runCommand(command, {
      cwd: projectTargetPath,
      successMessage: "AssemblyScript compilation completed successfully",
      errorMessage: "AssemblyScript compilation failed",
    });
  }

  private runAssemblyScriptChecker(
    projectTargetPath: string,
    contractName: string,
    endpoint?: string,
  ): void {
    const defaultEndpoint = "https://sepolia-rollup.arbitrum.io/rpc";
    const rpcEndpoint = endpoint || defaultEndpoint;

    const command = `cargo stylus check --wasm-file ${BUILD_WASM_PATH}/${contractName}.wasm --endpoint ${rpcEndpoint}`;

    runCommand(command, {
      cwd: projectTargetPath,
      successMessage: "AssemblyScript checker completed successfully",
      errorMessage: "AssemblyScript checker failed",
    });
  }

  compile(endpoint?: string): void {
    const cwd = getCurrentWorkingDirectory();
    const projectTargetPath = this.projectFinder.getProjectBuildPath();
    const contractName = this.projectFinder.getContractName(this.contractPath);

    this.runTypeScriptChecker(cwd, contractName);
    this.runEslintChecker(cwd, contractName);
    this.runBuild();
    this.runAssemblyScriptCompiler(projectTargetPath, contractName);
    this.runAssemblyScriptChecker(projectTargetPath, contractName, endpoint);
  }
}
