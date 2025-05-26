import fs from "fs";
import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";
import { ErrorManager } from "../analyzers/shared/error-manager.js";
import { buildAbi } from "./build-abi.js";
import { buildAsconfig } from "./build-asconfig.js";
import { buildEntrypoint } from "./build-entrypoint.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildRustToolchain } from "./build-rust-toolchain.js";
import { buildTsconfig } from "./build-tsconfig.js";
import { Logger } from "@/cli/services/logger.js";

export class ProjectBuilder {
  private userIndexPath: string;
  private contract: IRContract;
  private errorManager: ErrorManager;

  constructor(userIndexPath: string, contract: IRContract, errorManager: ErrorManager) {
    this.userIndexPath = userIndexPath;
    this.contract = contract;
    this.errorManager = errorManager;
  }

  validate(): boolean {
    // Validate project structure
    const contractBasePath = path.dirname(this.userIndexPath);
    const targetPath = path.join(contractBasePath, ".dist");

    if (!fs.existsSync(contractBasePath)) {
      this.errorManager.addSemanticError(
        "Contract base path does not exist",
        contractBasePath
      );
      return false;
    }

    // Validate contract name
    if (!this.contract.name) {
      this.errorManager.addSemanticError(
        "Contract must have a name",
        this.userIndexPath
      );
      return false;
    }


    return true;
  }

  build(): void {
    const contractBasePath = path.dirname(this.userIndexPath);
    const targetPath = path.join(contractBasePath, ".dist");

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Build all project files
    buildEntrypoint(this.userIndexPath, this.contract);
    buildAsconfig(targetPath);
    buildTsconfig(targetPath);
    buildPackageJson(targetPath);
    buildRustToolchain(targetPath);
    buildAbi(targetPath, this.contract);

    Logger.getInstance().info(`Build artifacts generated at ${targetPath}`);
  }
} 