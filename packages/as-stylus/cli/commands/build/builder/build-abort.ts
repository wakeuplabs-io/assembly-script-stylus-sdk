import path from "path";

import { ASSEMBLY_BUILD_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

export function buildAbort(targetPath: string) {
  writeFile(
    path.join(targetPath, ASSEMBLY_BUILD_PATH, "stylus.ts"),
    `
    // Fallback functions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function abort(message: usize, fileName: usize, line: u32, column: u32): void {
      return;
    }
    `,
  );
}
