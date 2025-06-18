// ---------------------------------------------------------------
//  End-to-end tests — ERC20Full contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";
config();

import { encodeStringsDynamic, decodeStringReturn } from "./string-abi.js";
import {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  pad64,
} from "./utils.js";

const SELECTOR = {
  DEPLOY: "0xb5488487",
  NAME: "0x06fdde03",
  SYMBOL: "0x95d89b41",
  DECIMALS: "0x313ce567",
  TOTAL_SUPPLY: "0x18160ddd",
  BALANCE_OF: "0x70746586",
  ALLOWANCE: "0x562731da",
  TRANSFER: "0x52e52198",
  TRANSFER_FROM: "0xe1fc6a01",
  APPROVE: "0x3f33b9fb",
  MINT: "0xc15c5996",
  BURN: "0x1003cd60",
};

const NAME_STR = "MyToken";
const SYMBOL_STR = "MYT";
const DECIMALS_18 = pad64(18n);

const INIT_SUPPLY = pad64(1000n);
const AMOUNT_100 = pad64(100n);
const ZERO_64 = pad64(0n);
const MINT_50 = pad64(50n);
const BURN_30 = pad64(30n);

const OWNER = stripAnsi(run(`cast wallet address --private-key ${PRIVATE_KEY}`)).toLowerCase();
const USER_B = stripAnsi(
  run(`cast wallet address --private-key ${USER_B_PRIVATE_KEY}`),
).toLowerCase();
run(`cast send ${USER_B} --value 0.1ether --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  const projectRoot = path.join(ROOT, "/as-stylus/");
  const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/erc20-full");

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

  const dataDeploy = SELECTOR.DEPLOY + encodeStringsDynamic(NAME_STR, SYMBOL_STR);

  run(
    `cast send ${contractAddr} ${dataDeploy.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
  );
}, 120_000);

const expectHex = (data: string, hex: string) =>
  expect(helpers.callData(data).toLowerCase()).toBe(hex.toLowerCase());

const expectString = (data: string, expected: string) => {
  const decoded = decodeStringReturn(helpers.callData(data).trim());
  expect(decoded).toBe(expected);
};

describe("ERC20Full end-to-end", () => {
  describe.skip("basic functionality", () => {
    it("name() returns correct value", () => expectString(calldata(SELECTOR.NAME), NAME_STR));
    it("symbol() returns correct value", () => expectString(calldata(SELECTOR.SYMBOL), SYMBOL_STR));
    it("decimals() returns 18", () => expectHex(calldata(SELECTOR.DECIMALS), DECIMALS_18));
    it("totalSupply equals minted amount", () => {
      helpers.sendData(calldata(SELECTOR.MINT, OWNER, INIT_SUPPLY));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), INIT_SUPPLY);
    });

    it("owner balance equals minted amount", () =>
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), INIT_SUPPLY));

    it("transfer updates balances", () => {
      helpers.sendData(calldata(SELECTOR.TRANSFER, USER_B, AMOUNT_100));
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(900n));
      expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), AMOUNT_100);
    });

    it("initial allowance is zero", () =>
      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), ZERO_64));

    it("approve sets allowance", () => {
      helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, AMOUNT_100));
      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), AMOUNT_100);
    });

    it("transferFrom succeeds and updates balances + allowance", () => {
      helpers.sendDataFrom(USER_B, calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, AMOUNT_100));

      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), ZERO_64);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(800n));
      expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), pad64(200n));
    });

    it("mint increases totalSupply and recipient balance", () => {
      helpers.sendData(calldata(SELECTOR.MINT, USER_B, MINT_50));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), pad64(1050n));
      expectHex(calldata(SELECTOR.BALANCE_OF, USER_B), pad64(250n));
    });

    it("burn decreases totalSupply and sender balance", () => {
      helpers.sendData(calldata(SELECTOR.BURN, BURN_30));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), pad64(1020n));
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), pad64(770n));
    });
  });

  describe("edge cases", () => {
    it("minting 0 tokens has no effect", () => {
      const beforeSupply = helpers.callData(SELECTOR.TOTAL_SUPPLY);
      const beforeBalance = helpers.callData(calldata(SELECTOR.BALANCE_OF, OWNER));
      helpers.sendData(calldata(SELECTOR.MINT, OWNER, pad64(0n)));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), beforeSupply);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), beforeBalance);
    });

    it("transferring more than balance fails", () => {
      const tooMuch = pad64(999999999999999n);
      const beforeSupply = helpers.callData(SELECTOR.TOTAL_SUPPLY);
      const beforeBalance = helpers.callData(calldata(SELECTOR.BALANCE_OF, OWNER));
      helpers.sendData(calldata(SELECTOR.TRANSFER, USER_B, tooMuch));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), beforeSupply);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), beforeBalance);
    });

    it("burning more than balance fails", () => {
      const tooMuch = pad64(999999999999999n);
      const beforeSupply = helpers.callData(SELECTOR.TOTAL_SUPPLY);
      const beforeBalance = helpers.callData(calldata(SELECTOR.BALANCE_OF, OWNER));
      helpers.sendData(calldata(SELECTOR.BURN, tooMuch));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), beforeSupply);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), beforeBalance);
    });

    it("re-approve overwrites previous allowance", () => {
      helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, pad64(30n)));
      helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, pad64(70n)));
      expectHex(calldata(SELECTOR.ALLOWANCE, OWNER, USER_B), pad64(70n));
    });

    it("transferFrom without approval fails", () => {
      const beforeSupply = helpers.callData(SELECTOR.TOTAL_SUPPLY);
      const beforeBalance = helpers.callData(calldata(SELECTOR.BALANCE_OF, OWNER));
      helpers.sendDataFrom(USER_B, calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, pad64(500n)));
      expectHex(calldata(SELECTOR.TOTAL_SUPPLY), beforeSupply);
      expectHex(calldata(SELECTOR.BALANCE_OF, OWNER), beforeBalance);
    });
  });
});
