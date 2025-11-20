import fs from "fs";
import path from "path";

import { getCounterTemplate } from "@/templates/counter.js";

export function buildContract(targetPath: string) {
  fs.mkdirSync(path.join(targetPath, "src/contracts"), { recursive: true });
  fs.writeFileSync(path.join(targetPath, "src/contracts/counter.ts"), getCounterTemplate());
}
