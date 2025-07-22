/**
 * Main entry point for transforming IR to AssemblyScript
 */
import fs from "fs";
import path from "path";

import { registerTransformer, typeTransformers } from "./base-transformer.js";
import { emitContract } from "./emit-contract.js";
import { IRContract } from "../../../../types/ir.types.js";
import { StructTransformer } from "../struct/struct-transformer.js";

/**
 * Transform IR contract representation into AssemblyScript code
 * and write it to the specified output directory
 * 
 * @param outDir Output directory for the generated code
 * @param contract The IR contract to transform
 */
export function transformFromIR(outDir: string, contract: IRContract) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Register StructTransformer dynamically with contract structs
  let structTransformer: StructTransformer | null = null;
  if (contract.structs && contract.structs.length > 0) {
    structTransformer = new StructTransformer(contract.structs);
    registerTransformer(structTransformer);
  }

  try {
    const contractTs = emitContract(contract);
    fs.writeFileSync(path.join(outDir, `${contract.path}.transformed.ts`), contractTs);
  } finally {
    if (structTransformer && typeTransformers["Struct"]) {
      delete typeTransformers["Struct"];
    }
  }
}