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
          compile: "as-stylus compile",
          deploy: "as-stylus deploy",
          clean: "as-stylus clean",
        },
      },
      null,
      2,
    ),
  );
}
