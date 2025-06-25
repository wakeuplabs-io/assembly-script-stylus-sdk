// ---------------------------------------------------------------
//  End-to-end tests — ERC20Full contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";
config();

import { generateEventSignature } from "@/cli/commands/build/transformers/event/event-transformer.js";

import { encodeStringsDynamic, decodeStringReturn } from "./string-abi.js";
import { TransferEventLog } from "./types.js";
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
  getFunctionSelector,
} from "./utils.js";

const TRANSFER_EVENT = {
  name: "Transfer",
  fields: [
    { name: "from", type: "Address", indexed: true },
    { name: "to", type: "Address", indexed: true },
    { name: "value", type: "U256", indexed: false },
  ],
};

const APPROVAL_EVENT = {
  name: "Approval",
  fields: [
    { name: "owner", type: "Address", indexed: true },
    { name: "spender", type: "Address", indexed: true },
    { name: "value", type: "U256", indexed: false },
  ],
};

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy(string,string)"),
  NAME: getFunctionSelector("name()"),
  SYMBOL: getFunctionSelector("symbol()"),
  DECIMALS: getFunctionSelector("decimals()"),
  TOTAL_SUPPLY: getFunctionSelector("totalSupply()"),
  BALANCE_OF: getFunctionSelector("balanceOf(address)"),
  ALLOWANCE: getFunctionSelector("allowance(address,address)"),
  TRANSFER: getFunctionSelector("transfer(address,uint256)"),
  TRANSFER_FROM: getFunctionSelector("transferFrom(address,address,uint256)"),
  APPROVE: getFunctionSelector("approve(address,uint256)"),
  MINT: getFunctionSelector("mint(address,uint256)"),
  BURN: getFunctionSelector("burn(uint256)"),
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
  console.log({ contractAddr, OWNER, USER_B });
}, 120_000);

const expectHex = (data: string, hex: string) =>
  expect(helpers.callData(data).toLowerCase()).toBe(hex.toLowerCase());

const expectString = (data: string, expected: string) => {
  const decoded = decodeStringReturn(helpers.callData(data).trim());
  expect(decoded).toBe(expected);
};

describe("ERC20Full end-to-end", () => {
  describe("basic functionality", () => {
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

  describe("ERC20Full — Events", () => {
    it("emits Transfer event on mint", () => {
      const expectedTopic0 = generateEventSignature(TRANSFER_EVENT);
      const receipt = helpers.sendData(calldata(SELECTOR.MINT, OWNER, INIT_SUPPLY));
      const logs = receipt.logs;
      expect(logs.length).toBeGreaterThan(0);
      const log = logs.find(
        (l: TransferEventLog) => l.topics[0].toLowerCase() === "0x" + expectedTopic0.toLowerCase(),
      );
      expect(log).toBeDefined();
      expect(log.topics[1].toLowerCase()).toBe(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
      expect(log.topics[2].toLowerCase()).toBe(pad64(BigInt(OWNER)));
      expect(log.data.toLowerCase()).toBe(INIT_SUPPLY);
    });

    it("emits Approval event on approve", () => {
      const expectedTopic0 = generateEventSignature(APPROVAL_EVENT);
      const receipt = helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, AMOUNT_100));

      const logs = receipt.logs;
      expect(logs.length).toBeGreaterThan(0);
      const log = logs.find(
        (l: TransferEventLog) => l.topics[0].toLowerCase() === "0x" + expectedTopic0.toLowerCase(),
      );
      expect(log).toBeDefined();
      expect(log.topics[1].toLowerCase()).toBe(pad64(BigInt(OWNER)));
      expect(log.topics[2].toLowerCase()).toBe(pad64(BigInt(USER_B)));
      expect(log.data.toLowerCase()).toBe(AMOUNT_100);
    });

    it("emits Transfer and Approval on transferFrom", () => {
      helpers.sendData(calldata(SELECTOR.MINT, OWNER, INIT_SUPPLY));

      const expectedTopicTransfer = generateEventSignature(TRANSFER_EVENT);
      const expectedTopicApproval = generateEventSignature(APPROVAL_EVENT);

      helpers.sendData(calldata(SELECTOR.APPROVE, USER_B, AMOUNT_100));

      const { receipt } = helpers.sendDataFrom(
        USER_B,
        calldata(SELECTOR.TRANSFER_FROM, OWNER, USER_B, AMOUNT_100),
      );
      const logs = receipt.logs;

      expect(logs.length).toBeGreaterThanOrEqual(2);
      const transferLog = logs.find(
        (l: TransferEventLog) =>
          l.topics[0].toLowerCase() === "0x" + expectedTopicTransfer.toLowerCase(),
      );
      const approvalLog = logs.find(
        (l: TransferEventLog) =>
          l.topics[0].toLowerCase() === "0x" + expectedTopicApproval.toLowerCase(),
      );

      expect(transferLog.topics[1].toLowerCase()).toBe(pad64(BigInt(OWNER)));
      expect(transferLog.topics[2].toLowerCase()).toBe(pad64(BigInt(USER_B)));
      expect(transferLog.data.toLowerCase()).toBe(AMOUNT_100);

      expect(approvalLog.topics[1].toLowerCase()).toBe(pad64(BigInt(OWNER)));
      expect(approvalLog.topics[2].toLowerCase()).toBe(pad64(BigInt(USER_B)));
      expect(approvalLog.data.toLowerCase()).toBe(pad64(0n));
    });
  });
});
