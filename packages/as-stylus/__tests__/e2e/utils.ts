// ---------------------------------------------------------------
//  Utils — build / deploy / call helpers for Stylus e2e tests
// ---------------------------------------------------------------
import { execSync } from "child_process";
import { config } from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import stripAnsiRaw from "strip-ansi";
import { toFunctionSelector } from "viem";

config();
export const ROOT = path.resolve(__dirname, "../../..");
export const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
export const PRIVATE_KEY = process.env.PRIVATE_KEY!;
export const USER_B_PRIVATE_KEY = process.env.USER_B_PRIVATE_KEY!;

if (!PRIVATE_KEY) throw new Error("⚠️  Set PRIVATE_KEY in .env");
if (!USER_B_PRIVATE_KEY) throw new Error("⚠️  Set USER_B_PRIVATE_KEY in .env");

export function run(cmd: string, cwd: string = ROOT, allowErr = false): string {
  try {
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
  } catch (e: unknown) {
    if (!allowErr) throw e;
    const out = (e as { stdout?: string }).stdout ?? "";
    const err = (e as { stderr?: string }).stderr ?? "";
    return (out + err).trim();
  }
}

export const stripAnsi = (s: string) => stripAnsiRaw(s);

export const pad64 = (v: bigint, with0x = true) =>
  (with0x ? "0x" : "") + v.toString(16).padStart(64, "0");

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
      let receipt = null;
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

export function getFunctionSelector(signature: string) {
  return toFunctionSelector(signature);
}

export function getAbi(abiPath: string) {
  return JSON.parse(readFileSync(abiPath, "utf-8"));
}
