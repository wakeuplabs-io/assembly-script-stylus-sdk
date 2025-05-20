// ---------------------------------------------------------------
// End-to-end tests for Counter contract (Stylus).
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
  GET: "0x67657400",
  INC: "0x696e6372",
  DEC: "0x64656372"
};
const MAX_U256_HEX =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const ZERO64 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const ONE64 =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const TWO64 =
  "0x0000000000000000000000000000000000000000000000000000000000000002";

let contractAddr = "";

beforeAll(() => {
  run("npm run build");
  const testPkg = path.join(ROOT, "../../contracts/test");
  run("npm run compile", testPkg);
  run("npm run check", testPkg);

  const log = stripAnsi(run(`PRIVATE_KEY=${PK} npm run deploy`, testPkg));
  const m = log.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  if (!m) throw new Error("Could not scrape contract address");
  contractAddr = m[1];
  console.log("📍 Deployed at", contractAddr);
}, 120_000);

function castSend(sel: string) {
  run(
    `cast send --rpc-url ${RPC_URL} --private-key ${PK} ${contractAddr} ${sel}`
  );
}
function castCall(sel: string): string {
  return run(`cast call --rpc-url ${RPC_URL} ${contractAddr} ${sel}`);
}
function expectHex(sel: string, expected: string) {
  expect(castCall(sel).toLowerCase()).toBe(expected.toLowerCase());
}

describe.skip("Counter (U256) exhaustive but tx-light", () => {
  it("0 → underflow → MAX → wrap-back", () => {
    expectHex(SELECTOR.GET, ZERO64);
    castSend(SELECTOR.DEC);

    expectHex(SELECTOR.GET, MAX_U256_HEX);

    castSend(SELECTOR.INC);

    expectHex(SELECTOR.GET, ZERO64);
  });

  it("small progression: +1, +1, -1 ⇒ value 1", () => {
    castSend(SELECTOR.INC);
    castSend(SELECTOR.INC);
    castSend(SELECTOR.DEC);

    expectHex(SELECTOR.GET, ONE64);
  });
});
