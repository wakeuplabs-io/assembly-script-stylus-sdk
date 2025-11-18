import fs from "fs";
import path from "path";

export function buildTsconfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "./tsconfig.test.json",
        compilerOptions: {
          strictPropertyInitialization: false,
        },
        include: ["src/**/*"],
      },
      null,
      2,
    ),
  );
}
