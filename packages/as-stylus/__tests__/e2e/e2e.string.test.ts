// ---------------------------------------------------------------
//  End-to-end tests — StringStorage contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";
config();

import { decodeStringReturn, encodeStringInput, parseAbiString } from "./string-abi.js";
import { ROOT, PRIVATE_KEY, run, stripAnsi, pad64, createContractHelpers } from "./utils.js";

const SELECTOR = {
  SET_STORAGE: "0xa57b0b0b",
  GET_STORAGE: "0x3408f73a",
  SUBSTRING: "0x71d66e68",
};

function calldataSetStorage(str: string): string {
  return SELECTOR.SET_STORAGE + encodeStringInput(str);
}

function calldataGetStorage(): string {
  return SELECTOR.GET_STORAGE;
}

function calldataSubstring(off: bigint, len: bigint): string {
  return SELECTOR.SUBSTRING + pad64(off, false) + pad64(len, false);
}

const LONG_STRING = "abcdefghijklmnopqrstuvwxyz1234567890!@#";

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

function expectAbiString(callData: string, expected: string) {
  const raw = helpers.callData(callData).trim();
  const { offset, len } = parseAbiString(raw);

  expect(offset).toBe(0x20);
  expect(len).toBe(Buffer.byteLength(expected, "utf8"));
  expect(raw.length).toBe(2 + 128 + ((len + 31) & ~31) * 2); // total bytes

  const decoded = decodeStringReturn(raw);
  expect(decoded).toBe(expected);
}


beforeAll(() => {
  const projectRoot = path.join(ROOT, "/as-stylus/");
  const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/string");

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
}, 120_000);

describe("StringStorage end-to-end (ABI-checked)", () => {
  it("stores and retrieves 'hello'", () => {
    helpers.sendData(calldataSetStorage("hello"));
    expectAbiString(calldataGetStorage(), "hello");
  });

  it("substring('hello',1,3) == 'ell'", () => {
    expectAbiString(calldataSubstring(1n, 3n), "ell");
  });

  it("stores and retrieves LONG_STRING (40 bytes)", () => {
    helpers.sendData(calldataSetStorage(LONG_STRING));
    expectAbiString(calldataGetStorage(), LONG_STRING);
  });

  it("substring(LONG_STRING,0,2) == 'ab'", () => {
    expectAbiString(calldataSubstring(0n, 2n), "ab");
  });
});
