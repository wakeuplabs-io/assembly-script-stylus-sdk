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
} from "./utils.js";

const SELECTOR = {
  DEPLOY: "0x44335bb8",
  TOTAL_SUPPLY: "0x18160ddd",
  BALANCE_OF: "0x70746586",
  ALLOWANCE: "0x562731da",
  TRANSFER: "0x52e52198",
  APPROVE: "0x3f33b9fb",
};

const INIT_SUPPLY = pad64(1000n);
const AMOUNT_100 = pad64(100n);
const ZERO_64 = pad64(0n);

const USER_B = "0x2222222222222222222222222222222222222222";

const OWNER = stripAnsi(run(`cast wallet address --private-key ${PRIVATE_KEY}`)).toLowerCase();
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
  console.log("📍 Deployed ERC20 at", contractAddr);

  const dataDeploy = calldata(SELECTOR.DEPLOY, INIT_SUPPLY);
  run(
    `cast send ${contractAddr} ${dataDeploy.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
  );
}, 120_000);

const castSend = (data: string) => helpers.sendData(data);
const castCall = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) => {
  expect(castCall(data).toLowerCase()).toBe(hex.toLowerCase());
};

describe("ERC20 — supply, balances, approve/allowance", () => {
  it("totalSupply() = initialSupply", () => {
    expectHex(calldata(SELECTOR.TOTAL_SUPPLY), INIT_SUPPLY);
  });

  it("balanceOf(owner) = initialSupply", () => {
    expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), INIT_SUPPLY);
  });

  describe("transfer()", () => {
    it("balances after transfer", () => {
      const tx = castSend(calldata(SELECTOR.TRANSFER, USER_B, AMOUNT_100));
      console.log((tx as any).logs as string[]);
      const expectedOwner = pad64(900n);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), expectedOwner);
      expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), AMOUNT_100);
    });
  });

  describe("approve / allowance", () => {
    it("allowance(owner, userB) = 0 initially", () => {
      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), ZERO_64);
    });

    it("allowance(owner, userB) = 100", () => {
      const tx = castSend(calldata(SELECTOR.APPROVE, USER_B, AMOUNT_100));
      console.log((tx as any).logs as string[]);
      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), AMOUNT_100);
    });
  });
});
