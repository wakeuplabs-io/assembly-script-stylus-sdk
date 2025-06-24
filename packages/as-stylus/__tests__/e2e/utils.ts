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
export const USER_B_PRIVATE_KEY = process.env.USER_B_PRIVATE_KEY;

if (!PRIVATE_KEY) throw new Error("⚠️  Set PRIVATE_KEY in .env");
if (!USER_B_PRIVATE_KEY) throw new Error("⚠️  Set USER_B_PRIVATE_KEY in .env");

export function run(cmd: string, cwd: string = ROOT, allowErr = false): string {
  try {
    console.log(`🔍 Run: ${cmd}`);
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
  } catch (e: any) {
    if (!allowErr) throw e;
    const out = (e.stdout ?? "").toString();
    const err = (e.stderr ?? "").toString();
    return (out + err).trim();
  }
}

export const stripAnsi = (s: string) => stripAnsiRaw(s);

export const pad64 = (v: bigint, with0x = true) =>
  (with0x ? "0x" : "") + v.toString(16).padStart(64, "0");

export const padAddress = (v: bigint, with0x = true) =>
  (with0x ? "0x" : "") + v.toString(16).padStart(40, "0");

export const padBool = (v: boolean, with0x = true) => (with0x ? "0x" : "") + (v ? "01" : "00");

export function calldata(selector: string, ...args: string[]): string {
  const clean = (h: string) => (h.startsWith("0x") ? h.slice(2) : h);
  return `0x${clean(selector)}${args.map(clean).join("")}`;
}

export function createContractHelpers(contractAddr: string) {
  const USER_B = stripAnsi(
    run(`cast wallet address --private-key ${USER_B_PRIVATE_KEY}`),
  ).toLowerCase();

  return {
    sendData: (data: string) => {
      const raw = run(
        `cast send ${contractAddr} ${data.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --json`,
      );
      const json = JSON.parse(raw);
      return json;
    },
    // helpers.sendDataFrom
    sendDataFrom: (address: string, data: string) => {
      const key =
        address.toLowerCase() === USER_B.toLowerCase()
          ? process.env.USER_B_PRIVATE_KEY
          : PRIVATE_KEY;

      const cmd = `cast send ${contractAddr} ${data.slice(2)} \
    --private-key ${key} --rpc-url ${RPC_URL} --json`;

      const raw = run(cmd, ROOT, true);
      let receipt: any = null;
      try {
        receipt = JSON.parse(raw);
      } catch (_) {
        // ignore: raw no es JSON, es un mensaje de error
      }

      const reverted = !receipt || receipt.status === "0x0" || /execution reverted/i.test(raw);

      return { reverted, receipt, raw };
    },

    callData: (data: string) =>
      stripAnsi(run(`cast call ${contractAddr} ${data} --rpc-url ${RPC_URL}`)).trim(),
  };
}
