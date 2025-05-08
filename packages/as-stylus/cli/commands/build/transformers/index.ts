// cli/transformers/index.ts
import { Project } from "ts-morph";
import path from "path";
import { IRContract } from "../../../types/ir.types.js";
import { ContractTransformer, U256Transformer } from "./u256/u256-ast.transformer.js";

export function applyTransforms(transformedPath: string, contract: IRContract): void {
  console.log("[as‑stylus] Applying AST transforms…");

  // transformU256(transformedPath, contract);

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });
  const sourceFile = project.addSourceFileAtPath(transformedPath);
  U256Transformer.for(sourceFile).factory().methods();
  ContractTransformer.for(sourceFile).flatten();
  // Insert required imports at the very top
  let text = sourceFile.getFullText();
  const importBlock = [
    "import { U256 } from '../../../as-stylus/core/types/u256';",
    "import { malloc } from '../../../as-stylus/core/modules/memory';",
    "import { createStorageKey } from '../../../as-stylus/core/modules/storage';",
    "import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from '../../../as-stylus/core/modules/hostio';",
    ""
  ].join('\n');
  // Remove any previous imports for idempotency
  text = text.replace(/^(import .*?;\s*)+/gm, '');
  text = importBlock + text.trimStart();
  let assignIdx = 0;
  text = text.replace(/(\s*)load_(\w+)\(\)\s*=\s*([\s\S]*?);/gm, (match, indent, slot, rhs) => {
    const tempName = `ptr${assignIdx++}`;
    // Remove any blank lines before or after the assignment
    return `${indent}const ${tempName} = ${rhs.trim()};\n${indent}store_${slot}(${tempName});`;
  });
  // Remove any extra blank lines between const ptrN and store_counter(ptrN)
  text = text.replace(/(const ptr\d+ = [^;]+;)[ \t]*\n[ \t]*\n([ \t]*store_counter\(ptr\d+\);)/g, '$1\n$2');
  sourceFile.replaceWithText(text);
  // Save the file after all transforms
  sourceFile.saveSync();

  console.log("[as‑stylus] ✔ Transforms completed.");
}
