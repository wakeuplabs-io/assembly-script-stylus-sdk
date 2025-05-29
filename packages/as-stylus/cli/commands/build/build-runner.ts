import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { applyAnalysis } from "./analyzers/index.js";
import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { IRBuilder } from "./analyzers/shared/ir-builder.js";
import { buildProject } from "./builder/index.js";
import { transformFromIR } from "./transformers/index.js";

export class BuildRunner extends IRBuilder<void> {
  private projectFinder: ProjectFinder;
  private buildPath: string;

  constructor(contractsRoot: string, buildPath: string, errorManager: ErrorManager) {
    super(errorManager);
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
    this.buildPath = buildPath;
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  buildIR(): void {
    const project = this.projectFinder.getCurrentProject();

    const contractPaths = this.projectFinder.getAllContractPaths(project);
    const projectName = project.split("/").pop()!;

    contractPaths.forEach((contractPath) => {
      const projectTargetPath = path.join(path.dirname(project), projectName, this.buildPath);
      const contractName = contractPath.split("/").pop()!;
      const transformedPath = path.join(
        projectTargetPath,
        `${contractName.replace(".ts", "")}.transformed.ts`
      );

      if (!fs.existsSync(projectTargetPath)) {
        Logger.getInstance().info(`Creating project: ${projectName}`);
        fs.mkdirSync(projectTargetPath, { recursive: true });
      }

      Logger.getInstance().info(`Processing: ${contractPath} -> ${transformedPath}`);
      fs.copyFileSync(contractPath, transformedPath);

      const contract: IRContract = applyAnalysis(transformedPath, this.errorManager);
      buildProject(transformedPath, contract);
      transformFromIR(projectTargetPath, contract);

      Logger.getInstance().info(`Generated contract project at: ${projectTargetPath}`);
    });
  }
} 