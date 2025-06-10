// ---------------------------------------------------------------
//  Utils — build / deploy / call helpers for Stylus e2e tests
// ---------------------------------------------------------------
import { execSync } from "child_process";
import { config } from "dotenv";
import path from "path";
import stripAnsiRaw from "strip-ansi"; // liviano, sin deps nativas
config();
export const ROOT = path.resolve(__dirname, "../../..");
export const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("⚠️  Set PRIVATE_KEY in .env");

export function run(cmd: string, cwd: string = ROOT): string {
  return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
}
export const stripAnsi = (s: string) => stripAnsiRaw(s);

export const pad64 = (v: bigint) => "0x" + v.toString(16).padStart(64, "0");

export function calldata(selector: string, ...args: string[]): string {
  const clean = (h: string) => (h.startsWith("0x") ? h.slice(2) : h);
  return `0x${clean(selector)}${args.map(clean).join("")}`;
}

export function createContractHelpers(
  addr: string,
  pk: string = PRIVATE_KEY ?? "",
  rpc: string = RPC_URL,
) {
  function sendData(data: string): string {
    const raw = run(`cast send ${addr} ${data} --private-key ${pk} --rpc-url ${rpc} --json`);
    const json = JSON.parse(raw);
    return json;
  }

  function callData(data: string): string {
    return run(`cast call ${addr} ${data} --rpc-url ${rpc}`);
  }

  return { sendData, callData };
}
