// ---------------------------------------------------------------
//  End-to-end tests — ERC20 contract (Stylus)
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
  USER_B_PRIVATE_KEY,
} from "./utils.js";

const SELECTOR = {
  DEPLOY: "0x44335bb8",
  TOTAL_SUPPLY: "0x18160ddd",
  BALANCE_OF: "0x70746586",
  ALLOWANCE: "0x562731da",
  TRANSFER: "0x52e52198",
  TRANSFER_FROM: "0xe1fc6a01",
  APPROVE: "0x3f33b9fb",
};

const INIT_SUPPLY = pad64(1000n);
const AMOUNT_100 = pad64(100n);
const ZERO_64 = pad64(0n);

const OWNER = stripAnsi(run(`cast wallet address --private-key ${PRIVATE_KEY}`)).toLowerCase();
const USER_B = stripAnsi(
  run(`cast wallet address --private-key ${USER_B_PRIVATE_KEY}`),
).toLowerCase();
run(`cast send ${USER_B} --value 0.1ether --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  const projectRoot = path.join(ROOT, "/as-stylus/");
  const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/erc20");

  run("npm run pre:build", projectRoot);
  run("npx as-stylus build", pkg);
  run("npm run compile", pkg);
  run("npm run check", pkg);
  run("npx prettier --write ./artifacts/contract.transformed.ts", pkg);

  const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, pkg));
  const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  if (!m) throw new Error("Could not scrape contract address");
  contractAddr = m[1];

  helpers = createContractHelpers(contractAddr);

  const dataDeploy = calldata(SELECTOR.DEPLOY, INIT_SUPPLY);
  run(
    `cast send ${contractAddr} ${dataDeploy.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
  );
}, 120_000);

const expectHex = (data: string, hex: string) => {
  expect(helpers.callData(data).toLowerCase()).toBe(hex.toLowerCase());
};

describe("ERC20 end-to-end", () => {
  it("totalSupply equals initial", () => {
    expectHex(calldata(SELECTOR.TOTAL_SUPPLY), INIT_SUPPLY);
  });

  it("owner balance equals initial", () => {
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), INIT_SUPPLY);
  });

  it("transfer updates balances", () => {
    helpers.sendData(calldata(SELECTOR.TRANSFER, USER_B, AMOUNT_100));
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(900n));
    expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), AMOUNT_100);
  });

  it("initial allowance is zero", () => {
    expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), ZERO_64);
  });

  it("approve sets allowance", () => {
    helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, AMOUNT_100));
    expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), AMOUNT_100);
  });

  it("transferFrom succeeds and updates balances and allowance", () => {
    helpers.sendDataFrom(USER_B, calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, AMOUNT_100));
    expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), ZERO_64);
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(800n));
    expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), pad64(200n));
  });

  it("transferFrom fails when allowance insufficient", () => {
    helpers.sendDataFrom(USER_B, calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, AMOUNT_100));
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(800n));
    expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), pad64(200n));
  });

  it("transferFrom fails when owner balance insufficient", () => {
    helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, INIT_SUPPLY));
    helpers.sendDataFrom(USER_B, calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, INIT_SUPPLY));
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(800n));
    expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), pad64(200n));
  });
});
