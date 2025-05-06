// cli/transformers/index.ts
import { Project } from "ts-morph";
import { transformNewU256 } from "./u256/new-u256.js";
import path from "path";

export function applyTransforms(transformedFile: string): void {
  console.log("[as‑stylus] Applying AST transforms…");

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);

  transformNewU256(sourceFile);

  sourceFile.saveSync();
  console.log("[as‑stylus] ✔ Transforms completed.");
}
