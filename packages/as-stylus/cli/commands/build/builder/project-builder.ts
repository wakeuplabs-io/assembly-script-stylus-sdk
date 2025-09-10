import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { BUILD_PATH } from "@/cli/utils/constants.js";

import { buildAbi } from "./build-abi.js";
import { buildAbort } from "./build-abort.js";
import { buildAsconfig } from "./build-asconfig.js";
import { buildEntrypoint } from "./build-entrypoint.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildRustToolchain } from "./build-rust-toolchain.js";
import { buildTsconfig } from "./build-tsconfig.js";
import { ErrorManager } from "../analyzers/shared/error-manager.js";

export class ProjectBuilder {
  private userIndexPath: string;
  private contract: IRContract;
  private allContracts: IRContract[];
  private errorManager: ErrorManager;

  constructor(
    userIndexPath: string,
    contract: IRContract,
    allContracts: IRContract[],
    errorManager: ErrorManager,
  ) {
    this.userIndexPath = userIndexPath;
    this.contract = contract;
    this.allContracts = allContracts;
    this.errorManager = errorManager;
  }

  validate(): boolean {
    // Validate project structure
    const contractBasePath = path.dirname(this.userIndexPath);

    if (!fs.existsSync(contractBasePath)) {
      this.errorManager.addSemanticError("Contract base path does not exist", contractBasePath);
      return false;
    }

    // Validate contract name
    if (!this.contract.name) {
      this.errorManager.addSemanticError("Contract must have a name", this.userIndexPath);
      return false;
    }

    return true;
  }

  build(): void {
    const contractBasePath = path.dirname(this.userIndexPath);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(contractBasePath)) {
      fs.mkdirSync(contractBasePath, { recursive: true });
    }

    // Build all project files
    buildEntrypoint(this.userIndexPath, this.contract);
    buildAsconfig(contractBasePath);
    buildAbort(contractBasePath);
    buildTsconfig(contractBasePath);
    buildPackageJson(contractBasePath);
    buildRustToolchain(contractBasePath);
    buildAbi(contractBasePath, this.contract);

    Logger.getInstance().info(`Build artifacts generated at ./${BUILD_PATH}`);
  }
}
