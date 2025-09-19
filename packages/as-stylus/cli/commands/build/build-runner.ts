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
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  buildIR(projectTargetPath: string): {
    ir: IRContract;
    transformedPath: string;
    projectTargetPath: string;
  } {
    const contractName = this.projectFinder.getContractName(this.contractPath);
    const transformedPath = path.join(projectTargetPath, `${contractName}.transformed.ts`);

    if (!fs.existsSync(projectTargetPath)) {
      fs.mkdirSync(projectTargetPath, { recursive: true });
    }

    const transformedReducedPath = `./${BUILD_PATH}/${contractName}.transformed.ts`;
    Logger.getInstance().info(`Processing: ${this.contractPath} -> ${transformedReducedPath}`);
    fs.copyFileSync(this.contractPath, transformedPath);

    return {
      ir: applyAnalysis(contractName, transformedPath),
      transformedPath,
      projectTargetPath,
    };
  }
}
