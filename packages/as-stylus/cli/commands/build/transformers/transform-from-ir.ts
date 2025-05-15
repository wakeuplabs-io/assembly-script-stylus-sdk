import fs from "fs";
import path from "path";
import { IRContract } from "../../../types/ir.types.js";
import { emitContract } from "./core/emit-contract.js";


export function transformFromIR(contract: IRContract, outDir: string) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const contractTs = emitContract(contract);

  fs.writeFileSync(path.join(outDir, "contract.transformed.ts"), contractTs);
}
