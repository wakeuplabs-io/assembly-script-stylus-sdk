import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateAsconfig } from "./builder/generate-asconfig.js";
import { generatePackageJson } from "./builder/generate-package-json.js";
import { generateRustToolchain } from "./builder/generate-rust-toolchain.js";
import { generateTsconfig } from "./builder/generate-tsconfig.js";
import { generateEntrypoint } from "./builder/generate-entrypoint.js";
import { applyTransforms } from "./transformers/index.js";


const USER_CONTRACT_PATH = "../contracts/test-1/index.ts";

export function runBuild() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const userFilePath = path.resolve(__dirname, USER_CONTRACT_PATH);
  const contractBasePath = path.dirname(userFilePath);
  const targetPath = path.join(contractBasePath, ".dist");

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  fs.mkdirSync(targetPath, { recursive: true });
  applyTransforms()


  generateEntrypoint();
  generateAsconfig(targetPath);
  generateTsconfig(targetPath);
  generatePackageJson(targetPath);
  generateRustToolchain(targetPath);

  console.log(`Generated new contract project at: ${targetPath}`);
}

runBuild();
