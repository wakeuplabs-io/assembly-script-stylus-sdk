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
 * @param contract The IR contract to transform
 * @param outDir Output directory for the generated code
 */
export function transformFromIR(contract: IRContract, outDir: string) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const contractTs = emitContract(contract);

  fs.writeFileSync(path.join(outDir, "contract.transformed.ts"), contractTs);
}