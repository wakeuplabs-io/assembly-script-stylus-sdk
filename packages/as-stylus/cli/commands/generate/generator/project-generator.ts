import path from "path";

import { ensureDir } from "@/cli/utils/fs.js";

import { buildContract } from "./build-contract.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildTsconfig } from "./build-tsconfig.js";

export class ProjectGenerator {
  private contractsRoot: string;
  private projectName: string;

  constructor(contractsRoot: string, projectName: string) {
    this.contractsRoot = contractsRoot;
    this.projectName = projectName;
  }

  generate(): void {
    const targetPath = ensureDir(path.join(this.contractsRoot, this.projectName));

    buildTsconfig(targetPath);
    buildPackageJson(targetPath, this.projectName);
    buildContract(targetPath);
  }
}
