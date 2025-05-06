import fs from "fs";
import path from "path";
import { applyTransforms } from "./transformers/index.js";
import { applyValidations } from "./validators/index.js";
import { buildEntrypoint } from "./builder/build-entrypoint.js";
import { buildAsconfig } from "./builder/build-asconfig.js";
import { buildTsconfig } from "./builder/build-tsconfig.js";
import { buildPackageJson } from "./builder/build-package-json.js";
import { buildRustToolchain } from "./builder/build-rust-toolchain.js";
import { AnalyzedContract } from "../../types/types.js";
import { buildAbi } from "./builder/build-abi.js";

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
  // applyTransforms(transformedPath);  

  const contract: AnalyzedContract = applyValidations(transformedPath) 

  buildEntrypoint(userIndexPath, contract);

  buildAsconfig(targetPath);
  buildTsconfig(targetPath);
  buildPackageJson(targetPath);
  buildRustToolchain(targetPath);
  buildAbi(targetPath, contract);

  console.log(`Generated new contract project at: ${targetPath}`);
}

runBuild();
