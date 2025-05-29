import fs from "fs";
import { IRBuilder } from "../build/analyzers/shared/ir-builder.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";
import { ProjectGenerator } from "./generator/project-generator.js";
import { Logger } from "@/cli/services/logger.js";

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

  validateAndGenerate(): void {
    if (!this.validate()) {
      process.exit(1);
    }

    const generator = new ProjectGenerator(this.contractsRoot, this.projectName);
    generator.generate();

    Logger.getInstance().info(
      `Project "${this.projectName}" created successfully at ${this.contractsRoot}/${this.projectName}`,
    );
  }
}
