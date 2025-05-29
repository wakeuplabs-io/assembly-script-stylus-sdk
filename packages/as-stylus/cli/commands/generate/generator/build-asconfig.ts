import { BUILD_WASM_PATH } from "@/cli/utils/constants.js";
import fs from "fs";
import path from "path";

export function buildAsconfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "asconfig.json"),
    JSON.stringify(
      {
        targets: {
          debug: {
            outFile: `${BUILD_WASM_PATH}/module.wasm`,
            textFile: `${BUILD_WASM_PATH}/module.wat`,
            jsFile: `${BUILD_WASM_PATH}/module.js`,
            optimizeLevel: 0,
            shrinkLevel: 0,
            sourceMap: true,
            noAssert: true,
            debug: true,
          },
          release: {
            outFile: `${BUILD_WASM_PATH}/module.wasm`,
            textFile: `${BUILD_WASM_PATH}/module.wat`,
            jsFile: `${BUILD_WASM_PATH}/module.js`,
            sourceMap: true,
            optimizeLevel: 0,
            shrinkLevel: 0,
            noAssert: true,
            converge: true,
          },
        },
        options: {
          bindings: "esm",
          runtime: "stub",
        },
      },
      null,
      2,
    ),
  );
}
