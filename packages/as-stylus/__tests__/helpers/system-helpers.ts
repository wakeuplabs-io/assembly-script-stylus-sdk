import { execSync } from "child_process";
import { config } from "dotenv";
import path from "path";
import stripAnsiRaw from "strip-ansi";
import { fileURLToPath } from "url";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "../../..");
export const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const USER_B_PRIVATE_KEY = process.env.USER_B_PRIVATE_KEY;

if (!PRIVATE_KEY) throw new Error("⚠️  Set PRIVATE_KEY in .env");
if (!USER_B_PRIVATE_KEY) throw new Error("⚠️  Set USER_B_PRIVATE_KEY in .env");

export function run(cmd: string, cwd: string = ROOT, allowErr = false): string {
  try {
    console.log(`🔍 Run: ${cmd}`);
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
  } catch (e: unknown) {
    if (!allowErr) throw e;
    const out = (e as { stdout?: string }).stdout ?? "";
    const err = (e as { stderr?: string }).stderr ?? "";
    return (out + err).trim();
  }
}

export const stripAnsi = (s: string) => stripAnsiRaw(s);
