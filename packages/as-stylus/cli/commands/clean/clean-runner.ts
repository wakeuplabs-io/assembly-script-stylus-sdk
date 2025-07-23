import fs from "fs";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { BUILD_PATH } from "@/cli/utils/constants.js";

export class CleanRunner {
  private contractsRoot: string;

  constructor(contractsRoot: string) {
    this.contractsRoot = contractsRoot;
  }

  clean(): void {
    const buildPath = path.join(this.contractsRoot, BUILD_PATH);

    if (fs.existsSync(buildPath)) {
      Logger.getInstance().info(`Removing build artifacts from: ${BUILD_PATH}`);
      fs.rmSync(buildPath, { recursive: true, force: true });
      Logger.getInstance().info("Build artifacts cleaned successfully");
    } else {
      Logger.getInstance().info("No build artifacts found to clean");
    }
  }
}
