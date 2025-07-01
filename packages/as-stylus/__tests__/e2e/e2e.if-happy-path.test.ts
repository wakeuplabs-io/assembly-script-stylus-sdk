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
} from "../helpers/utils.js";

const SELECTOR = {
  DEPLOY: "0x775c300c",
  GET_LOWER_WITH_FLAG: "0x0901da10",
  GET_LOWER_WITH_COMPARISON: "0x7ff4a6a8",
  GET_LOWER_WITH_COMPARISON_FUNCTION: "0x89d96c26",
  GET_LOWER_WITH_NESTED_IF: "0x8d72a083",
};

const VALUE_1 = pad64(1n);
const VALUE_3 = pad64(3n);
const VALUE_5 = pad64(5n);
const VALUE_10 = pad64(10n);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;
beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    run("npm run pre:build", projectRoot);
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/if-happy-path");
    console.log("pkg", pkg);
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

// const send = (data: string) => helpers.sendData(data);
const call = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) =>
  expect(call(data).toLowerCase()).toBe(hex.toLowerCase());

describe("Storage (U256) — basic operations", () => {
  it("getLowerWithFlag() after deploy ⇒ 5", () => {
    expectHex(calldata(SELECTOR.GET_LOWER_WITH_FLAG), VALUE_5);
  });
  it("getLowerWithComparison() after deploy ⇒ 1", () => {
    expectHex(calldata(SELECTOR.GET_LOWER_WITH_COMPARISON), VALUE_1);
  });
  it("getLowerWithComparisonFunction() after deploy ⇒ 10", () => {
    expectHex(calldata(SELECTOR.GET_LOWER_WITH_COMPARISON_FUNCTION), VALUE_10);
  });
  it("getLowerWithNestedIf() after deploy ⇒ 3", () => {
    expectHex(calldata(SELECTOR.GET_LOWER_WITH_NESTED_IF), VALUE_3);
  });
});
