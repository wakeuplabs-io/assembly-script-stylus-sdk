import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateAsconfig } from "./builder/generate-asconfig.js";
import { generatePackageJson } from "./builder/generate-package-json.js";
import { generateRustToolchain } from "./builder/generate-rust-toolchain.js";
import { generateTsconfig } from "./builder/generate-tsconfig.js";
import { generateEntrypoint } from "./builder/generate-entrypoint.js";
import { applyTransforms } from "./transformers/index.js";


export function runBuild() {

  // const projectRoot   = process.cwd();}
  
  // const userIndexPath = fs.existsSync(path.resolve(projectRoot, "index.ts"))
  // ? path.resolve(projectRoot, "index.ts")
  // : fallbackContractPath;

  const fallbackProjectRoot = path.resolve("/Users/francoperez/repos/wakeup/assembly-script-stylus-sdk/packages/contracts/test-1");
  const fallbackContractPath = path.resolve("/Users/francoperez/repos/wakeup/assembly-script-stylus-sdk/packages/contracts/test-1/index.ts");
  const userIndexPath = fallbackContractPath;

  if (!fs.existsSync(userIndexPath)) {
    console.error(
      `[as‑stylus] Error: cannot find "index.ts" in ${userIndexPath}.
       Make sure you run "npx as-stylus build" inside a contract
       folder that contains an AssemblyScript entry file named index.ts.`
    );
    process.exit(1);
  }

  const targetPath = path.join(fallbackProjectRoot, ".dist");
  if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(targetPath, { recursive: true });

  const transformedPath = path.join(targetPath, "index.transformed.ts");
  fs.copyFileSync(userIndexPath, transformedPath);
  applyTransforms(transformedPath);   


  generateEntrypoint(targetPath);
  generateAsconfig(targetPath);
  generateTsconfig(targetPath);
  generatePackageJson(targetPath);
  generateRustToolchain(targetPath);

  console.log(`Generated new contract project at: ${targetPath}`);
}

runBuild();
