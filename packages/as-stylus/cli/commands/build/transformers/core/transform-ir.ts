/**
 * Main entry point for transforming IR to AssemblyScript
 */
import fs from "fs";
import path from "path";
import { IRContract } from "../../../../types/ir.types.js";
import { emitContract } from "./emit-contract.js";

/**
 * Transform IR contract representation into AssemblyScript code
 * and write it to the specified output directory
 * 
 * @param outDir Output directory for the generated code
 * @param contract The IR contract to transform
 */
export function transformFromIR(outDir: string, contract: IRContract) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const contractTs = emitContract(contract);

  fs.writeFileSync(path.join(outDir, "contract.transformed.ts"), contractTs);
}