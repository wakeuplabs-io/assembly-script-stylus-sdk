import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { BUILD_PATH } from "@/cli/utils/constants.js";

import { applyAnalysis } from "./analyzers/index.js";
import { ErrorManager } from "./analyzers/shared/error-manager.js";

export class BuildRunner {
  private projectFinder: ProjectFinder;
  private contractPath: string;

  constructor(contractsRoot: string, contractPath: string, errorManager: ErrorManager) {
    this.contractPath = contractPath;
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
    fs.rmSync(path.join(contractsRoot, BUILD_PATH), { recursive: true, force: true });
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  private getContractName(contractPath: string): string {
    return contractPath.split("/").pop()!.replace(".ts", "");
  }

  buildIR(): { ir: IRContract, transformedPath: string, projectTargetPath: string } {
    const project = this.projectFinder.getCurrentProject();

    const projectName = project.split("/").pop()!;

    const projectTargetPath = path.join(path.dirname(project), projectName, BUILD_PATH);
    const contractName = this.getContractName(this.contractPath);
    const transformedPath = path.join(
      projectTargetPath,
      `${contractName}.transformed.ts`
    );

    if (!fs.existsSync(projectTargetPath)) {
      fs.mkdirSync(projectTargetPath, { recursive: true });
    }
    
    Logger.getInstance().info(`Processing: ${this.contractPath} -> ${transformedPath}`);
    fs.copyFileSync(this.contractPath, transformedPath);
    
    return {
      ir: applyAnalysis(contractName, transformedPath),
      transformedPath,
      projectTargetPath,
    };

  }
} 