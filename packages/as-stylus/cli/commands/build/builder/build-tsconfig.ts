import fs from "fs";
import path from "path";

export function generateTsconfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "assemblyscript/std/assembly.json",
        include: ["./**/*.ts"],
      },
      null,
      2,
    ),
  );
}
