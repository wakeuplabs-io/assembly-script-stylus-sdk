// ---------------------------------------------------------------
//  End-to-end tests — Storage contract (Stylus)
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
} from "../helpers/utils.js";

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy(uint256)"),
  GET: getFunctionSelector("get()"),
  ADD: getFunctionSelector("add(uint256)"),
  SUB: getFunctionSelector("sub(uint256)"),
};

const INIT64 = pad64(5n);
const EIGHT64 = pad64(8n);
const SIX64 = pad64(6n);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;
beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    run("npm run pre:build", projectRoot);
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/storage");
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
      `cast send ${contractAddr} ${dataDeploy}${INIT64.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
    );

    console.log("📍 Deployed at", contractAddr);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to deploy contract:", errorMessage);
    throw error;
  }
}, 120_000);

const send = (data: string) => helpers.sendData(data);
const call = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) =>
  expect(call(data).toLowerCase()).toBe(hex.toLowerCase());

describe("Storage (U256) — basic operations", () => {
  it("get() after deploy ⇒ 5", () => {
    expectHex(calldata(SELECTOR.GET), INIT64);
  });

  it("add(3) then get() ⇒ 8", () => {
    send(calldata(SELECTOR.ADD, pad64(3n)));
    expectHex(calldata(SELECTOR.GET), EIGHT64);
  });

  it("sub(2) then get() ⇒ 6", () => {
    send(calldata(SELECTOR.SUB, pad64(2n)));
    expectHex(calldata(SELECTOR.GET), SIX64);
  });
});
