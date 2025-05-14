import fs from "fs";
import path from "path";

export function buildPackageJson(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "package.json"),
    JSON.stringify(
      {
        name: "generated-contract",
        version: "0.1.0",
        scripts: {
          compile: "asc entrypoint.ts --config asconfig.json",
          check: "cargo stylus check --wasm-file build/module.wasm",
          deploy:
            "PRIVATE_KEY=$PRIVATE_KEY cargo stylus deploy --wasm-file build/module.wasm --private-key $PRIVATE_KEY",
        },
      },
      null,
      2,
    ),
  );
}
