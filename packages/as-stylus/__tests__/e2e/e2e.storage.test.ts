// ---------------------------------------------------------------
// End-to-end tests for Storage (U256) - Stylus
// ---------------------------------------------------------------

import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";
config();

const ROOT = path.resolve(__dirname, "../");
const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
const PK = process.env.PRIVATE_KEY;
if (!PK) throw new Error("Set PRIVATE_KEY in .env");

function run(cmd: string, cwd = ROOT): string {
  return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
}
function stripAnsi(s: string): string {
  return s.replace(/\x1B\[[0-9;]*m/g, "");
}

const SELECTOR = {
  ADD: "0x61646400",
  SUB: "0x73756200",
  GET: "0x67657400",
  DEPLOY: "0x6465706c"
};

function u256(value: bigint): string {
  const hex = value.toString(16).padStart(64, "0");
  return `0x${hex}`;
}

function calldata(selector: string, ...args: string[]): string {
  const clean = (h: string) => h.startsWith("0x") ? h.slice(2) : h;
  return `0x${clean(selector)}${args.map(clean).join("")}`;
}

function castSendData(data: string) {
  run(`cast send ${contractAddr} ${data} --private-key ${PK} --rpc-url ${RPC_URL}`);
}

function castCallData(data: string): string {
  return run(`cast call ${contractAddr} ${data} --rpc-url ${RPC_URL}`);
}

let contractAddr = "";

beforeAll(() => {
  run("npm run build");
  const testPkg = path.join(ROOT, "../../contracts/test");
  run("npm run compile", testPkg);
  run("npm run check", testPkg);


  const init = u256(5n);
  const dataDeploy = calldata(SELECTOR.DEPLOY, init);

  const deployLog = stripAnsi(run(`PRIVATE_KEY=${PK} npm run deploy`, testPkg));
  const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  if (!m) throw new Error("Could not scrape contract address");
  contractAddr = m[1];

  run(`cast send ${contractAddr} ${dataDeploy} --private-key ${PK} --rpc-url ${RPC_URL}`);
  console.log("📍 Deployed at", contractAddr);
}, 120_000);

describe("Storage (U256) — operaciones básicas", () => {
  it("get() → 5 al inicio", () => {
    const data = calldata(SELECTOR.GET);
    const res = castCallData(data);
    console.log("📍 Result 1", res);
    expect(res.toLowerCase()).toBe(u256(5n).toLowerCase());
  });

  it("add(3) y luego get() → 8", () => {
    castSendData(calldata(SELECTOR.ADD, u256(3n)));
    const res = castCallData(calldata(SELECTOR.GET));
    console.log("📍 Result 2", res);
    expect(res.toLowerCase()).toBe(u256(8n).toLowerCase());
  });

  it("sub(2) y luego get() → 6", () => {
    castSendData(calldata(SELECTOR.SUB, u256(2n)));
    const res = castCallData(calldata(SELECTOR.GET));
    expect(res.toLowerCase()).toBe(u256(6n).toLowerCase());
  });
});