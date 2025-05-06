// cli/transformers/index.ts
import { Project } from "ts-morph";
import path from "path";
import { analyzeCallGraph } from "./call-graph";

export function applyValidations(transformedFile: string): void {
  console.log("[as‑stylus] Validating…");

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);

  analyzeCallGraph(sourceFile);
  sourceFile.saveSync();
  console.log("[as‑stylus] ✔ Structural validation completed.");
}
