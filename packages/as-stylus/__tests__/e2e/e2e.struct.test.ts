// ---------------------------------------------------------------
//  End-to-end tests — Struct contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { AbiCoder } from "ethers";
import path from "path";

config();

import { decodeStringReturn } from "../helpers/string-abi.js";
import {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  pad64,
  padBool,
  padAddress,
  getFunctionSelector,
  parseStructABIResponse,
  validateStructABIFormat,
  validateStructFieldValues,
  calculateExpectedStructSize,
  validateStringContentInABI,
} from "../helpers/utils.js";

const abi = new AbiCoder();

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy()"),
  SET_STRUCT: getFunctionSelector("setStruct(address,string,uint256,bool,uint256)"),
  GET_STRUCT_TO: getFunctionSelector("getStructTo()"),
  GET_STRUCT_CONTENTS: getFunctionSelector("getStructContents()"),
  GET_STRUCT_VALUE: getFunctionSelector("getStructValue()"),
  GET_STRUCT_FLAG: getFunctionSelector("getStructFlag()"),
  GET_STRUCT_VALUE2: getFunctionSelector("getStructValue2()"),
  GET_INFO: getFunctionSelector("getInfo()"),
};

const TEST_ADDRESS_BIGINT = 0x1234567890123456789012345678901234567890n;
const TEST_U256 = 42n;
const TEST_U256_2 = 100n;
const TEST_STRING = "Hello World!";

const ZERO_ADDRESS = padAddress(0n);
const TEST_ADDRESS_PAD = padAddress(TEST_ADDRESS_BIGINT);
const TEST_U256_PAD = pad64(TEST_U256);
const TEST_U256_2_PAD = pad64(TEST_U256_2);
const BOOL_TRUE_PAD = padBool(true);
const BOOL_FALSE_PAD = padBool(false);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

function calldataSetStruct(
  address: bigint,
  contents: string,
  value: bigint,
  flag: boolean,
  value2: bigint,
): string {
  const encoded = abi.encode(
    ["address", "string", "uint256", "bool", "uint256"],
    [`0x${address.toString(16).padStart(40, "0")}`, contents, value, flag, value2],
  );
  return SELECTOR.SET_STRUCT + encoded.slice(2);
}

beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/struct");
    run("npm run pre:build", projectRoot);
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

    console.log("📍 Deployed Struct contract at", contractAddr);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to deploy struct contract:", errorMessage);
    throw error;
  }
}, 120_000);

const castSend = (sel: string, gasLimit?: string) => helpers.sendData(sel, gasLimit);
const castCall = (sel: string) => helpers.callData(sel);
const expectHex = (sel: string, hex: string) =>
  expect(castCall(sel).toLowerCase()).toBe(hex.toLowerCase());

const expectString = (sel: string, expected: string) => {
  const raw = castCall(sel).trim();
  const decoded = decodeStringReturn(raw);
  expect(decoded).toBe(expected);
};

describe("Struct Contract Tests", () => {
  describe("Storage Operations", () => {
    it("should deploy successfully", () => {
      expect(contractAddr).toBeTruthy();
      expect(contractAddr.startsWith("0x")).toBe(true);
    });

    it("should have zero values initially", () => {
      expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
      expectHex(SELECTOR.GET_STRUCT_VALUE, pad64(0n));
      expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
      expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(0n));
      expectString(SELECTOR.GET_STRUCT_CONTENTS, "");
    });

    it("should set struct fields and retrieve them", () => {
      const setStructData = calldataSetStruct(
        TEST_ADDRESS_BIGINT,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      );
      castSend(setStructData, "62470600");

      expectHex(SELECTOR.GET_STRUCT_TO, TEST_ADDRESS_PAD);
      expectString(SELECTOR.GET_STRUCT_CONTENTS, TEST_STRING);
      expectHex(SELECTOR.GET_STRUCT_VALUE, TEST_U256_PAD);
      expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_TRUE_PAD);
      expectHex(SELECTOR.GET_STRUCT_VALUE2, TEST_U256_2_PAD);
    });

    it("should modify individual fields independently", () => {
      const NEW_VALUE = 999n;
      const NEW_VALUE_PAD = pad64(NEW_VALUE);
      const NEW_STRING = "New Content";

      const newSetData = calldataSetStruct(0n, NEW_STRING, NEW_VALUE, false, 77n);
      castSend(newSetData);

      expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
      expectString(SELECTOR.GET_STRUCT_CONTENTS, NEW_STRING);
      expectHex(SELECTOR.GET_STRUCT_VALUE, NEW_VALUE_PAD);
      expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
      expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(77n));
    });

    it("should handle boolean values correctly", () => {
      const setTrueData = calldataSetStruct(0n, "", 0n, true, 0n);
      castSend(setTrueData);
      expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_TRUE_PAD);

      const setFalseData = calldataSetStruct(0n, "", 0n, false, 0n);
      castSend(setFalseData);
      expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
    });

    it("should handle empty and long strings", () => {
      const LONG_STRING = "abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()";

      const emptySetData = calldataSetStruct(TEST_ADDRESS_BIGINT, "", TEST_U256, true, TEST_U256_2);
      castSend(emptySetData);
      expectString(SELECTOR.GET_STRUCT_CONTENTS, "");

      const longSetData = calldataSetStruct(
        TEST_ADDRESS_BIGINT,
        LONG_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      );
      castSend(longSetData);
      expectString(SELECTOR.GET_STRUCT_CONTENTS, LONG_STRING);
    });
  });

  describe("Memory Operations", () => {
    beforeEach(() => {
      const setupData = calldataSetStruct(
        TEST_ADDRESS_BIGINT,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      );
      castSend(setupData);
    });

    it("should perform memory operations in getInfo correctly", () => {
      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      validateStructFieldValues(analysis, {
        address: "1234567890123456789012345678901234567890000000000000000000000000",
        value: 43,
        boolean: true,
        value2: 42,
      });

      expectHex(SELECTOR.GET_STRUCT_VALUE, TEST_U256_PAD);
      expectHex(SELECTOR.GET_STRUCT_VALUE2, TEST_U256_2_PAD);
    });

    it("should handle empty string in memory operations", () => {
      const emptyStringData = calldataSetStruct(TEST_ADDRESS_BIGINT, "", 50n, false, 75n);
      castSend(emptyStringData);

      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      validateStructFieldValues(analysis, {
        value: 51,
        stringLength: 0,
      });

      const expectedSize = calculateExpectedStructSize(0);
      expect(analysis.totalBytes).toBe(expectedSize);
    });

    it("should handle long string in memory operations", () => {
      const longString =
        "This is a very long string that exceeds thirty-two characters and should test padding";
      const longStringData = calldataSetStruct(TEST_ADDRESS_BIGINT, longString, 123n, true, 456n);
      castSend(longStringData);

      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      validateStructFieldValues(analysis, {
        value: 124,
        stringLength: longString.length,
      });

      const expectedSize = calculateExpectedStructSize(longString.length);
      expect(analysis.totalBytes).toBe(expectedSize);
    });

    it("should handle zero values in memory operations", () => {
      const zeroData = calldataSetStruct(0n, "zero", 0n, false, 0n);
      castSend(zeroData);

      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      validateStructFieldValues(analysis, {
        address: "0".repeat(64),
        value: 1,
        boolean: false,
        value2: 0,
      });
    });

    it("should handle maximum values correctly", () => {
      const maxValues = calldataSetStruct(
        0xffffffffffffffffffffffffffffffffffffffffn,
        "MAX",
        2n ** 200n,
        true,
        2n ** 100n,
      );
      castSend(maxValues);

      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      expect(analysis.address.toLowerCase()).toBe(
        "ffffffffffffffffffffffffffffffffffffffff000000000000000000000000",
      );
      expect(BigInt("0x" + analysis.slots[2])).toBe(2n ** 200n + 1n);
      expect(analysis.boolean).toBe(true);
      expect(BigInt("0x" + analysis.slots[4])).toBe(2n ** 200n);
    });

    it("should validate ABI encoding format consistency", () => {
      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      expect(analysis.stringLength).toBeGreaterThan(0);
      expect(analysis.stringLength).toBeLessThan(1000);
      validateStringContentInABI(analysis.stringContent, analysis.stringLength);
    });

    it("should maintain struct field alignment", () => {
      const response = castCall(SELECTOR.GET_INFO);
      const analysis = parseStructABIResponse(response);

      validateStructABIFormat(analysis);
      expect(analysis.totalBytes % 32).toBe(0);
      expect(analysis.slots.length).toBeGreaterThanOrEqual(5);
      expect(analysis.stringOffset).toBe(160);
    });
  });
});
