// ----------------------------------------------------------------
// End-to-end tests for AdminRegistry (Address) - Stylus
// ----------------------------------------------------------------

import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";
config();

const ROOT     = path.resolve(__dirname, "../");
const RPC_URL  = process.env.RPC_URL ?? "http://localhost:8547";
const PK       = process.env.PRIVATE_KEY;
if (!PK) throw new Error("Set PRIVATE_KEY in .env");

function run(cmd: string, cwd = ROOT): string {
  return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
}
function stripAnsi(s: string): string {
  return s.replace(/\x1B\[[0-9;]*m/g, "");
}

const SELECTOR = {
  DEPLOY:      "0x6465706c",
  SET_ADMIN:   "0x73657461",
  RESET_ADMIN: "0x72657365",
  GET_ADMIN:   "0x67657461",
  IS_ADMIN:    "0x69736164",
  IS_ZERO:     "0x697a6572"
};

function address(addr: string): string {
  return addr.toLowerCase().padStart(42, "0").replace(/^0x/, "").padStart(64, "0");
}
function calldata(selector: string, ...args: string[]): string {
  const clean = (x: string) => x.startsWith("0x") ? x.slice(2) : x;
  return `0x${clean(selector)}${args.map(clean).join("")}`;
}
function castSendData(data: string) {
  run(`cast send ${contractAddr} ${data} --private-key ${PK} --rpc-url ${RPC_URL}`);
}
function castCallData(data: string): string {
  return run(`cast call ${contractAddr} ${data} --rpc-url ${RPC_URL}`);
}

let contractAddr = "";
const adminHex   = "0x1111111111111111111111111111111111111111";
const adminPadded = address(adminHex);

beforeAll(() => {
  run("npm run build");
  const testPkg = path.join(ROOT, "../../contracts/test/");
  run("npm run compile", testPkg);
  run("npm run check", testPkg);

  const init = Buffer.from(adminHex.slice(2).padStart(40, "0"), "hex").toString("hex").padStart(64, "0");
  const dataDeploy = calldata(SELECTOR.DEPLOY, init);

  const deployLog = stripAnsi(run(`PRIVATE_KEY=${PK} npm run deploy`, testPkg));
  const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  if (!m) throw new Error("Could not scrape contract address");
  contractAddr = m[1];

  run(`cast send ${contractAddr} ${dataDeploy} --private-key ${PK} --rpc-url ${RPC_URL}`);
  console.log("📍 Deployed at", contractAddr);
}, 120_000);

describe("AdminRegistry (Address) — e2e", () => {
  it("getAdmin() → debe devolver la dirección inicial", () => {
    const res = castCallData(calldata(SELECTOR.GET_ADMIN));
    expect(res.toLowerCase()).toContain(adminHex.toLowerCase());
  });

  // it("adminIsZero() → false al inicio", () => {
  //   const res = castCallData(calldata(SELECTOR.IS_ZERO));
  //   expect(res.toLowerCase()).toBe("0x00");
  // });

  // it("isAdmin(addr) → true si es igual al inicial", () => {
  //   const res = castCallData(calldata(SELECTOR.IS_ADMIN, adminPadded));
  //   expect(res.toLowerCase()).toBe("0x01");
  // });

  // it("setAdmin() → cambia el administrador", () => {
  //   const newAdmin = "0x2222222222222222222222222222222222222222";
  //   castSendData(calldata(SELECTOR.SET_ADMIN, address(newAdmin)));

  //   const res = castCallData(calldata(SELECTOR.GET_ADMIN));
  //   expect(res.toLowerCase()).toContain(newAdmin.slice(2));
  // });

  // it("resetAdmin() → lo deja en cero", () => {
  //   castSendData(calldata(SELECTOR.RESET_ADMIN));

  //   const isZero = castCallData(calldata(SELECTOR.IS_ZERO));
  //   expect(isZero.toLowerCase()).toBe("0x01");
  // });

});
