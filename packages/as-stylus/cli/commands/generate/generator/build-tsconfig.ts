import fs from "fs";
import path from "path";

export function buildTsconfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "assemblyscript/std/assembly.json",
        compilerOptions: {
          strictPropertyInitialization: false,
        },
        include: ["contract.ts"],
      },
      null,
      2,
    ),
  );
}
