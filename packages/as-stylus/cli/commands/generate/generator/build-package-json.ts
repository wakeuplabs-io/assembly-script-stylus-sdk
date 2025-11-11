import fs from "fs";
import path from "path";

import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";

export function buildPackageJson(targetPath: string, projectName: string) {
  fs.writeFileSync(
    path.join(targetPath, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "1.0.0",
        description: "",
        main: "index.js",
        scripts: {
          test: "jest --runInBand --testPathPatterns=/tests",
        },
        author: "",
        license: "ISC",
        type: "module",
        exports: {
          ".": {
            import: `${BUILD_WASM_PATH}/release.js`,
            types: `${BUILD_WASM_PATH}/release.d.ts`,
          },
        },
        dependencies: {
          "@wakeuplabs/as-stylus": "*",
          "@types/jest": "^30.0.0",
          jest: "^30.2.0",
          "ts-jest": "^29.4.4",
        },
        devDependencies: {
          assemblyscript: "^0.27.35",
        },
      },
      null,
      2,
    ),
  );
}
