import fs from "fs";
import path from "path";

import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

export function buildAsconfig(targetPath: string) {
  const cwd = process.cwd();

  const sdkCorePath = path.join(cwd, "core");
  const packageJsonPath = path.join(cwd, "package.json");
  const isLocalDevelopment = fs.existsSync(sdkCorePath) && fs.existsSync(packageJsonPath);

  let packageBasePath = "@wakeuplabs/as-stylus";

  if (isLocalDevelopment) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (packageJson.name === "@wakeuplabs/as-stylus") {
        packageBasePath = ".";
      }
    } catch (e) {
      // Fall through to check parent directories
    }
  }

  if (packageBasePath === "@wakeuplabs/as-stylus") {
    let currentDir = cwd;
    for (let i = 0; i < 5; i++) {
      const parentSdkCore = path.join(currentDir, "packages", "as-stylus", "core");
      const parentPackageJson = path.join(currentDir, "packages", "as-stylus", "package.json");

      if (fs.existsSync(parentSdkCore) && fs.existsSync(parentPackageJson)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(parentPackageJson, "utf-8"));
          if (packageJson.name === "@wakeuplabs/as-stylus") {
            packageBasePath = path.relative(cwd, path.join(currentDir, "packages", "as-stylus"));
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
  }

  interface AsConfigOptions {
    bindings: boolean;
    disable: string[];
    use: string[];
    runtime: string;
    exportStart: string;
    paths?: Record<string, string[]>;
  }

  interface AsConfigTarget {
    outFile: string;
    optimize: boolean;
    optimizeLevel: number;
    shrinkLevel: number;
    converge: boolean;
    debug?: boolean;
  }

  interface AsConfig {
    options: AsConfigOptions;
    targets: {
      debug: AsConfigTarget;
      release: AsConfigTarget;
    };
  }

  const config: AsConfig = {
    options: {
      bindings: false,
      disable: ["bulk-memory"],
      use: ["abort=assembly/stylus/stylus/abort"],
      runtime: "stub",
      exportStart: "myStart",
    },
    targets: {
      debug: {
        outFile: `${BUILD_WASM_PATH}/debug.wasm`,
        optimize: false,
        optimizeLevel: 0,
        shrinkLevel: 0,
        converge: false,
        debug: true,
      },
      release: {
        outFile: `${BUILD_WASM_PATH}/module.wasm`,
        optimize: true,
        optimizeLevel: 3,
        shrinkLevel: 2,
        converge: true,
      },
    },
  };

  if (packageBasePath !== "@wakeuplabs/as-stylus") {
    config.options.paths = {
      "@wakeuplabs/as-stylus/core/*": [`${packageBasePath}/core/*`],
      "./core/*": [`${packageBasePath}/core/*`],
    };
  }

  writeFile(path.join(targetPath, "asconfig.json"), JSON.stringify(config, null, 2));
}
