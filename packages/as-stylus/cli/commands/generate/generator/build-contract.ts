import fs from "fs";
import path from "path";
import { getCounterTemplate } from "@/templates/counter.js";

export function buildContract(targetPath: string) {
  fs.writeFileSync(path.join(targetPath, "contract.ts"), getCounterTemplate());
}
