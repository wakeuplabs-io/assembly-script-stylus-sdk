import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";

import { ProjectGenerator } from "./generator/project-generator.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export class GenerateRunner {
  private errorManager: ErrorManager;
  private contractsRoot: string;
  private projectName: string;

  constructor(contractsRoot: string, errorManager: ErrorManager, projectName: string) {
    this.contractsRoot = contractsRoot;
    this.projectName = projectName;
    this.errorManager = errorManager;
  }

  validate(): boolean {
    if (!this.projectName) {
      this.errorManager.addSemanticError("Project name is required", this.contractsRoot);
      return false;
    }

    const targetPath = `${this.contractsRoot}/${this.projectName}`;
    if (fs.existsSync(targetPath)) {
      this.errorManager.addSemanticError(
        `Project "${this.projectName}" already exists`,
        targetPath,
      );
      return false;
    }

    return true;
  }

  private runNpmInstall(): void {
    const projectPath = path.join(this.contractsRoot, this.projectName);
    const logger = Logger.getInstance();

    try {
      logger.info("Installing dependencies...");
      execSync("npm install", {
        cwd: projectPath,
        stdio: "inherit",
      });
      logger.info("Dependencies installed successfully");
    } catch (error) {
      logger.error(
        "Failed to install dependencies. Please run 'npm install' manually in the project directory.",
      );
      logger.error(`Error: ${error}`);
    }
  }

  validateAndGenerate(): void {
    if (!this.validate()) {
      process.exit(1);
    }

    const generator = new ProjectGenerator(this.contractsRoot, this.projectName);
    generator.generate();

    this.runNpmInstall();

    Logger.getInstance().info(
      `Project "${this.projectName}" created successfully at ${this.contractsRoot}/${this.projectName}`,
    );
    Logger.getInstance().info(
      "You can now compile your contract with: as-stylus compile contract.ts",
    );
  }
}
