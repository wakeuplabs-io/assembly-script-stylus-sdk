// cli/transformers/index.ts
import { Project } from "ts-morph";
import path from "path";
import { analyzeContract } from "./analyze-contract.js";
import { AnalyzedContract } from "../../../types/types";

export function applyValidations(transformedFile: string): AnalyzedContract {
  console.log("[as‑stylus] Validating…");

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);
  const contractAnalyzed: AnalyzedContract = analyzeContract(sourceFile);
  console.log("[as‑stylus] ✔ Structural validation completed.");

  return contractAnalyzed;
}
