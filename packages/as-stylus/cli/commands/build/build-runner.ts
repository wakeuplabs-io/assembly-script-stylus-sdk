import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { ProjectFinder } from "@/cli/services/project-finder.js";

import { applyAnalysis } from "./analyzers/index.js";
import { ErrorManager } from "./analyzers/shared/error-manager.js";
import { buildProject } from "./builder/index.js";
import { transformFromIR } from "./transformers/index.js";

export class BuildRunner {
  private projectFinder: ProjectFinder;
  private buildPath: string;

  constructor(contractsRoot: string, buildPath: string, errorManager: ErrorManager) {
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
    this.buildPath = buildPath;
    fs.rmSync(path.join(contractsRoot, buildPath), { recursive: true, force: true });
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  private getContractName(contractPath: string): string {
    return contractPath.split("/").pop()!.replace(".ts", "");
  }

  buildIR(): void {
    const project = this.projectFinder.getCurrentProject();

    const contractPaths = this.projectFinder.getAllContractPaths(project);
    const projectName = project.split("/").pop()!;
    
    const contracts = contractPaths.map((contractPath) => {
      const projectTargetPath = path.join(path.dirname(project), projectName, this.buildPath);
      const contractName = this.getContractName(contractPath);
      const transformedPath = path.join(
        projectTargetPath,
        `${contractName}.transformed.ts`
      );

      if (!fs.existsSync(projectTargetPath)) {
        Logger.getInstance().info(`Creating project: ${projectName}`);
        fs.mkdirSync(projectTargetPath, { recursive: true });
      }
      
      Logger.getInstance().info(`Processing: ${contractPath} -> ${transformedPath}`);
      fs.copyFileSync(contractPath, transformedPath);
      
      return {
        irContract: applyAnalysis(contractName, transformedPath),
        transformedPath,
        projectTargetPath,
      };
    });

    const allContracts = contracts.map((c) => c.irContract);
    contracts.forEach((contract) => {
      buildProject(contract.transformedPath, contract.irContract, allContracts);
      transformFromIR(contract.projectTargetPath, contract.irContract);
    });
  }
} 