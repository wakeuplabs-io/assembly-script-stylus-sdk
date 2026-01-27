import fs from "fs";
import path from "path";

const content = `import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const containerName = "as-stylus-testnode-8547";

export default async function globalTeardown() {
  console.log("🛑 Stopping Nitro node...");
  await execAsync(\`docker stop \${containerName}\`).catch(() => {});
  console.log("✅ Node stopped");
}

`;

export function buildGlobalTeardown(targetPath: string) {
  fs.writeFileSync(path.join(targetPath, "globalTeardown.ts"), content);
}
