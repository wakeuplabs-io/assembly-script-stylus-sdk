import fs from "fs";
import path from "path";
import { applyAnalysis } from "./analyzers/index.js";
import { IRContract } from "../../types/ir.types.js";
import { buildProject } from "./builder/index.js";
import { transformFromIR } from "./transformers/core/index.js";
export function runBuild() {

  // const projectRoot   = process.cwd();}

  // const userIndexPath = fs.existsSync(path.resolve(projectRoot, "index.ts"))
  // ? path.resolve(projectRoot, "index.ts")
  // : fallbackContractPath;

  const fallbackProjectRoot = path.resolve("/Users/francoperez/repos/wakeup/assembly-script-stylus-sdk/packages/contracts/test");
  const fallbackContractPath = path.resolve("/Users/francoperez/repos/wakeup/assembly-script-stylus-sdk/packages/contracts/test/contract.ts");
  const userIndexPath = fallbackContractPath;

  if (!fs.existsSync(userIndexPath)) {
    console.error(
      `[as‑stylus] Error: cannot find "index.ts" in ${userIndexPath}.
       Make sure you run "npx as-stylus build" inside a contract
       folder that contains an AssemblyScript entry file named contract.ts.`
    );
    process.exit(1);
  }

  const targetPath = path.join(fallbackProjectRoot, ".dist");
  if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(targetPath, { recursive: true });
  const transformedPath = path.join(targetPath, "contract.transformed.ts");
  fs.copyFileSync(userIndexPath, transformedPath);

  const contract: IRContract = applyAnalysis(transformedPath) 
  transformFromIR(path.dirname(transformedPath), contract);
  buildProject(userIndexPath, contract);

  console.log(`Generated new contract project at: ${targetPath}`);
}

runBuild();
