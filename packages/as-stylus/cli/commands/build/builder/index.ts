import fs from "fs";
import path from "path";

import { buildAbi } from "./build-abi.js";
import { buildAsconfig } from "./build-asconfig.js";
import { buildEntrypoint } from "./build-entrypoint.js";
import { buildPackageJson } from "./build-package-json.js";
import { buildRustToolchain } from "./build-rust-toolchain.js";
import { buildTsconfig } from "./build-tsconfig.js";
import { IRContract } from "../../../types/ir.types.js";

export function buildProject(userIndexPath: string, contract: IRContract): void {
  const contractBasePath = path.dirname(userIndexPath);
  const targetPath = path.join(contractBasePath, ".dist");

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  buildEntrypoint(userIndexPath, contract);
  buildAsconfig(targetPath);
  buildTsconfig(targetPath);
  buildPackageJson(targetPath);
  buildRustToolchain(targetPath);
  buildAbi(targetPath, contract);

  console.log(`[as‑stylus] ✔ Build artifacts generated at ${targetPath}`);
}
