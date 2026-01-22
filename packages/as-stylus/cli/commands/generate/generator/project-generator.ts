import path from "path";

import { ensureDir } from "@/cli/utils/fs.js";

import { buildContract } from "./build-contract.js";
import { buildEnvSample } from "./build-env-sample.js";
import { buildEslintConfig } from "./build-eslint.js";
import { buildGlobalSetup } from "./build-global-setup.js";
import { buildGlobalTeardown } from "./build-global-teardown.js";
import { buildJestConfig } from "./build-jest.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildTestsFolder } from "./build-tests-folder.js";
import { buildTsconfigTest } from "./build-tsconfig-test.js";
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
    buildJestConfig(targetPath);
    buildTsconfigTest(targetPath);
    buildTestsFolder(targetPath);
    buildEnvSample(targetPath);
    buildGlobalSetup(targetPath);
    buildGlobalTeardown(targetPath);
    buildEslintConfig(targetPath);
  }
}
