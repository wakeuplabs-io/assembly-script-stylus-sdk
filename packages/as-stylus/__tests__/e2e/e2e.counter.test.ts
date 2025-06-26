// ---------------------------------------------------------------
//  End-to-end tests — Counter contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";

config();

import {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  pad64,
  getFunctionSelector,
} from "./utils.js";

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy()"),
  GET: getFunctionSelector("get()"),
  INC: getFunctionSelector("increment()"),
  DEC: getFunctionSelector("decrement()"),
};

const U256_MAX = pad64((1n << 256n) - 1n);
const ZERO64 = pad64(0n);
const ONE64 = pad64(1n);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    run("npm run pre:build", projectRoot);
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/counter");
    run("npx as-stylus build", pkg);
    run("npm run compile", pkg);
    run("npm run check", pkg);

    const dataDeploy = calldata(SELECTOR.DEPLOY);

    const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, pkg));
    const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
    if (!m) throw new Error("Could not scrape contract address");
    contractAddr = m[1];
    helpers = createContractHelpers(contractAddr);
    run(
      `cast send ${contractAddr} ${dataDeploy} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
    );

    console.log("📍 Deployed at", contractAddr);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to deploy contract:", errorMessage);
    throw error;
  }
}, 120_000);

const castSend = (sel: string) => helpers.sendData(sel);
const castCall = (sel: string) => helpers.callData(sel);
const expectHex = (sel: string, hex: string) =>
  expect(castCall(sel).toLowerCase()).toBe(hex.toLowerCase());

describe("Counter (U256) — happy paths", () => {
  it("0 → underflow → MAX → wrap-back", () => {
    expectHex(SELECTOR.GET, ZERO64);
    castSend(SELECTOR.DEC);
    expectHex(SELECTOR.GET, U256_MAX);
    castSend(SELECTOR.INC);
    expectHex(SELECTOR.GET, ZERO64);
  });

  it("small progression: +1 +1 −1 ⇒ 1", () => {
    castSend(SELECTOR.INC);
    castSend(SELECTOR.INC);
    castSend(SELECTOR.DEC);
    expectHex(SELECTOR.GET, ONE64);
  });
});
