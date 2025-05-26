import fs from "fs";
import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";
import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { IRBuilder } from "./analyzers/shared/ir-builder.js";
import { applyAnalysis } from "./analyzers/index.js";
import { buildProject } from "./builder/index.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";
import { Logger } from "@/cli/services/logger.js";

export class BuildRunner extends IRBuilder<void> {
  private projectFinder: ProjectFinder;

  constructor(contractsRoot: string, errorManager: ErrorManager) {
    super(errorManager);
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  buildIR(): void {
    const projects = this.projectFinder.getAllProjects();

    projects.forEach((project) => {
      const contractPaths = this.projectFinder.getAllContractPaths(project);
      const projectName = project.split("/").pop()!;

      contractPaths.forEach((contractPath) => {
        const projectTargetPath = path.join(path.dirname(project), ".dist", projectName);
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

        Logger.getInstance().info(`Generated contract project at: ${projectTargetPath}`);
      });
    });
  }
} 