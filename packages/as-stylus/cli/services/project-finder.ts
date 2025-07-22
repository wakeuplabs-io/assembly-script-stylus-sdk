import fs from "fs";
import path from "path";

import { ErrorManager } from "../commands/build/analyzers/shared/error-manager.js";

export class ProjectFinder {
  private readonly contractsRoot: string;
  private readonly errorManager: ErrorManager;

  constructor(contractsRoot: string, errorManager: ErrorManager) {
    this.contractsRoot = contractsRoot;
    this.errorManager = errorManager;
  }

  getCurrentProject(): string {
    return path.resolve(process.cwd());
  }

  getAllProjects(): string[] {
    const folders = fs.readdirSync(this.contractsRoot);
    if (folders.length === 0) {
      this.errorManager.addSemanticError(
        "No projects found. Make sure you have a project in the contracts folder.",
        this.contractsRoot,
      );
      return [];
    }

    return folders.reduce((acc: string[], folder: string) => {
      if (folder.startsWith(".")) {
        return acc;
      }

      const folderPath = path.join(this.contractsRoot, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        return [...acc, folderPath];
      }

      return acc;
    }, []);
  }

  getAllContractPaths(projectRoot: string): string[] {
    const contractPaths = fs.readdirSync(projectRoot);
    const projectName = projectRoot.split("/").pop();

    if (contractPaths.length === 0) {
      this.errorManager.addSemanticError(
        `No contracts found. Make sure you have a [file].ts in the ${projectName} folder.`,
        projectRoot,
      );
      return [];
    }

    return contractPaths.reduce((acc: string[], contractPath: string) => {
      if (contractPath.endsWith(".ts")) {
        return [...acc, path.join(projectRoot, contractPath)];
      }
      return acc;
    }, []);
  }

  validateProjects(): boolean {
    // Validate contracts root exists
    if (!fs.existsSync(this.contractsRoot)) {
      this.errorManager.addSemanticError(
        "Contracts root directory does not exist",
        this.contractsRoot,
      );
      return false;
    }

    // Validate projects exist
    const projects = this.getAllProjects();
    if (projects.length === 0) {
      return false;
    }

    // Validate each project has contracts
    let hasValidProjects = true;
    projects.forEach((project) => {
      const contracts = this.getAllContractPaths(project);
      if (contracts.length === 0) {
        hasValidProjects = false;
      }
    });

    return hasValidProjects;
  }
}
