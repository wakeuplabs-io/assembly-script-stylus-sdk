import path from "path";

import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

export function buildAsconfig(targetPath: string) {
  writeFile(
    path.join(targetPath, "asconfig.json"),
    JSON.stringify(
      {
        options: {
          bindings: false,
          disable: ["bulk-memory"],
          // use: [`abort=${ASSEMBLY_BUILD_PATH}/stylus/abort`],
          use: [],
          runtime: "stub",
          exportStart: "myStart"
        },
      
        targets: {
          debug: {
            outFile: `${BUILD_WASM_PATH}/debug.wasm`,
            optimize: false,
            optimizeLevel: 0,
            shrinkLevel: 0,
            converge: false,
            debug: true
          },
          release: {
            outFile: `${BUILD_WASM_PATH}/module.wasm`,
            optimize: true,
            optimizeLevel: 3,
            shrinkLevel: 2,
            converge: true
          }
        }
      },
      null,
      2,
    ),
  );
}
