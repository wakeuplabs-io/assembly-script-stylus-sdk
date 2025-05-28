import { BUILD_PATH, BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import fs from "fs";
import path from "path";

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
          compile: `cd ${BUILD_PATH} && npm run compile`,
          check: `cd ${BUILD_PATH} && npm run check`,
          deploy: `cd ${BUILD_PATH} && npm run deploy`,
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
        devDependencies: {
          assemblyscript: "^0.27.35",
        },
      },
      null,
      2,
    ),
  );
}
