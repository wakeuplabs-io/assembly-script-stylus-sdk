// ---------------------------------------------------------------
//  End-to-end tests — Balances mapping contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";

config();

import {
  ROOT,
  PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  pad64,
} from "./utils.js";

/*───────────────────────────────*
 *  Selectores (ASCII-4 bytes)    *
 *───────────────────────────────*/
const SELECTOR = {
  SET: "0xb600447e", // "setB"
  GET: "0x3020f38f", // "getB"
};

/*───────────────────────────────*
 *  Datos de prueba               *
 *───────────────────────────────*/
const USER_A = "0x1111111111111111111111111111111111111111";
const USER_B = "0x2222222222222222222222222222222222222222";

const BAL_A = pad64(100n);
const BAL_B = pad64(200n);
const BAL_0 = pad64(0n);

/*───────────────────────────────*
 *  Despliegue único por archivo  *
 *───────────────────────────────*/
let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  const projectRoot = path.join(ROOT, "/as-stylus/");
  const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/balances");

  run("npm run pre:build", projectRoot);
  run("npx as-stylus build", pkg);
  run("npm run compile", pkg);
  run("npm run check", pkg);

  const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, pkg));
  const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  if (!m) throw new Error("Could not scrape contract address");
  contractAddr = m[1];

  helpers = createContractHelpers(contractAddr);
  console.log("📍 Deployed Balances at", contractAddr);
}, 120_000);

/*───────────────────────────────*
 *  Helpers send / call           *
 *───────────────────────────────*/
const send = (data: string) => helpers.sendData(data);
const call = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) =>
  expect(call(data).toLowerCase()).toBe(hex.toLowerCase());

/*───────────────────────────────*
 *  Test suite                    *
 *───────────────────────────────*/
describe("Balances mapping — basic ops", () => {
  it("initial getBalance(user) ⇒ 0", () => {
    expectHex(calldata(SELECTOR.GET, USER_A), BAL_0);
  });

  it("setBalance(userA, 100) ⇒ reflected", () => {
    send(calldata(SELECTOR.SET, USER_A, BAL_A));
    expectHex(calldata(SELECTOR.GET, USER_A), BAL_A);
  });

  it("setBalance(userB, 200) ⇒ independent slot", () => {
    send(calldata(SELECTOR.SET, USER_B, BAL_B));
    expectHex(calldata(SELECTOR.GET, USER_A), BAL_A);
    expectHex(calldata(SELECTOR.GET, USER_B), BAL_B);
  });
});
