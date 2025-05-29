import path from "path";
import { ensureDir } from "@/cli/utils/fs.js";
import { buildAsconfig } from "./build-asconfig.js";
import { buildTsconfig } from "./build-tsconfig.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildContract } from "./build-contract.js";

export class ProjectGenerator {
  private contractsRoot: string;
  private projectName: string;

  constructor(contractsRoot: string, projectName: string) {
    this.contractsRoot = contractsRoot;
    this.projectName = projectName;
  }

  generate(): void {
    const targetPath = ensureDir(path.join(this.contractsRoot, this.projectName));

    buildAsconfig(targetPath);
    buildTsconfig(targetPath);
    buildPackageJson(targetPath, this.projectName);
    buildContract(targetPath);
  }
}
