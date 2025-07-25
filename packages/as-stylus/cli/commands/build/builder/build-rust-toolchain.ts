import fs from "fs";
import path from "path";

export function buildRustToolchain(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "rust-toolchain.toml"),
    `[toolchain]
channel = "1.81.0"
`,
  );
}
