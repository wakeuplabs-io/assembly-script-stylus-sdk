// cli/transformers/index.ts
import path from "path";
import { Project } from "ts-morph";

import { IRContract } from "@/cli/types/ir.types.js";

import { analyzeContract } from "./analyze-contract.js";
import { exportContractToJSON, generateContractTree } from "./tree-builder.js";

export function applyAnalysis(transformedFile: string): IRContract {
  console.log("[as\u2011stylus] Validating\u2026");

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);
  const contractIR: IRContract = analyzeContract(sourceFile);

  // exportContractToJSON(contractIR);
  // generateContractTree(contractIR);

  console.log("[as\u2011stylus] \u2714 Structural validation completed.");

  return contractIR;
}
