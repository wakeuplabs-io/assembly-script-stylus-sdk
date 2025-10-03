import fs from "fs";
import path from "path";

import { getEslintFileTemplate } from "@/templates/eslint-file.js";

export function buildEslint(targetPath: string) {
  fs.writeFileSync(path.join(targetPath, "eslint.json"), getEslintFileTemplate());
}
