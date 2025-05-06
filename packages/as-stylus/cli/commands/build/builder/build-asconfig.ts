import fs from "fs";
import path from "path";

export function buildAsconfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "asconfig.json"),
    JSON.stringify(
      {
        targets: {
          debug: {
            outFile: "build/module.wasm",
            textFile: "build/module.wat",
            jsFile: "build/module.js",
            optimizeLevel: 0,
            shrinkLevel: 0,
            sourceMap: true,
            noAssert: true,
            debug: true,
          },
          release: {
            outFile: "build/module.wasm",
            textFile: "build/module.wat",
            jsFile: "build/module.js",
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
