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
  getFunctionSelector,
} from "./utils.js";

const SELECTOR = {
  SET: getFunctionSelector("setBalance(address,uint256)"),
  GET: getFunctionSelector("getBalance(address)"),
  APPROVE: getFunctionSelector("approve(address,address,uint256)"),
  ALLOWANCE: getFunctionSelector("allowanceOf(address,address)"),
};

const USER_A = "0x1111111111111111111111111111111111111111";
const USER_B = "0x2222222222222222222222222222222222222222";

const BAL_A = pad64(100n);
const BAL_B = pad64(200n);
const BAL_0 = pad64(0n);

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

const send = (data: string) => helpers.sendData(data);
const call = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) =>
  expect(call(data).toLowerCase()).toBe(hex.toLowerCase());

describe("Token contract — basic ops", () => {
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
  describe("Allowance mapping — basic ops", () => {
    it("initial allowance ⇒ 0", () => {
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), BAL_0);
    });

    it("approve(userA, userB, 100) ⇒ reflected", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_B, BAL_A));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), BAL_A);
    });

    it("approve(userB, userA, 200) ⇒ separate path", () => {
      send(calldata(SELECTOR.APPROVE, USER_B, USER_A, BAL_B));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), BAL_A);
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_B, USER_A), BAL_B);
    });

    it("approve(userA, userB, 0) ⇒ cleared", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_B, BAL_0));
      send(calldata(SELECTOR.APPROVE, USER_B, USER_A, BAL_0));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), BAL_0);
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_B, USER_A), BAL_0);
    });
  });

  describe("Token contract — edge cases & large values", () => {
    const MAX = (1n << 256n) - 1n;
    const MAX_MINUS_1 = MAX - 1n;
    const HALF = MAX >> 1n;
    const ONE = 1n;

    const MAX_HEX = pad64(MAX);
    const MAX_MINUS_1_HEX = pad64(MAX_MINUS_1);
    const HALF_HEX = pad64(HALF);
    const ONE_HEX = pad64(ONE);

    it("setBalance(userA, MAX) ⇒ reflected", () => {
      send(calldata(SELECTOR.SET, USER_A, MAX_HEX));
      expectHex(calldata(SELECTOR.GET, USER_A), MAX_HEX);
    });

    it("setBalance(userA, MAX-1) ⇒ reflected", () => {
      send(calldata(SELECTOR.SET, USER_A, MAX_MINUS_1_HEX));
      expectHex(calldata(SELECTOR.GET, USER_A), MAX_MINUS_1_HEX);
    });

    it("setBalance(userA, HALF) ⇒ reflected", () => {
      send(calldata(SELECTOR.SET, USER_A, HALF_HEX));
      expectHex(calldata(SELECTOR.GET, USER_A), HALF_HEX);
    });

    it("setBalance(userA, 1) ⇒ reflected", () => {
      send(calldata(SELECTOR.SET, USER_A, ONE_HEX));
      expectHex(calldata(SELECTOR.GET, USER_A), ONE_HEX);
    });

    it("approve(userA, userA, MAX) ⇒ valid", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_A, MAX_HEX));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_A), MAX_HEX);
    });

    it("approve(userA, userB, MAX-1) ⇒ reflected", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_B, MAX_MINUS_1_HEX));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), MAX_MINUS_1_HEX);
    });

    it("approve(userA, userB, HALF) ⇒ reflected", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_B, HALF_HEX));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), HALF_HEX);
    });

    it("approve(userA, userB, 1) ⇒ reflected", () => {
      send(calldata(SELECTOR.APPROVE, USER_A, USER_B, ONE_HEX));
      expectHex(calldata(SELECTOR.ALLOWANCE, USER_A, USER_B), ONE_HEX);
    });
  });
});
