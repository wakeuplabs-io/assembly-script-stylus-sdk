import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const containerName = "as-stylus-testnode-8547";

export default async function globalTeardown() {
  console.log("🛑 Stopping Nitro node...");
  await execAsync(`docker stop ${containerName}`).catch(() => {});
  console.log("✅ Node stopped");
}
