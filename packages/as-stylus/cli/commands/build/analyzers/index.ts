// cli/transformers/index.ts
import { Project } from "ts-morph";
import path from "path";
import { analyzeContract } from "./analyze-contract.js";
import { IRContract } from "../../../types/ir.types.js";

export function applyAnalysis(transformedFile: string): IRContract {
  console.log("[as‑stylus] Validating…");

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);
  const contractIR: IRContract = analyzeContract(sourceFile);
  console.log("[as‑stylus] ✔ Structural validation completed.");

  return contractIR;
}
