// ---------------------------------------------------------------
//  End-to-end tests — Struct contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { AbiCoder } from "ethers";
import path from "path";

config();

import { decodeStringReturn } from "./string-abi.js";
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
} from "./utils.js";

const abi = new AbiCoder();

const SELECTOR = {
  DEPLOY: "0x775c300c",
  SET_STRUCT: "0x7c85a726", // setStruct(address,string,uint256,bool,uint256)
  GET_STRUCT_TO: "0x4b8f2596", // getStructTo()
  GET_STRUCT_CONTENTS: "0x770cd840", // getStructContents()
  GET_STRUCT_VALUE: "0x0c5acbd8", // getStructValue()
  GET_STRUCT_FLAG: "0x0e1d8c26", // getStructFlag()
  GET_STRUCT_VALUE2: "0x1cc7673e", // getStructValue2()
};

// Test data
const TEST_ADDRESS_BIGINT = 0x1234567890123456789012345678901234567890n;
const TEST_U256 = 42n;
const TEST_U256_2 = 100n;
const TEST_STRING = "Hello World!";

// Padded values for testing
const ZERO_ADDRESS = padAddress(0n);
const TEST_ADDRESS_PAD = padAddress(TEST_ADDRESS_BIGINT);
const TEST_U256_PAD = pad64(TEST_U256);
const TEST_U256_2_PAD = pad64(TEST_U256_2);
const BOOL_TRUE_PAD = padBool(true);
const BOOL_FALSE_PAD = padBool(false);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

// Helper function to create properly encoded setStruct calldata
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

describe("Struct Contract — field operations", () => {
  it("should deploy successfully", () => {
    expect(contractAddr).toBeTruthy();
    expect(contractAddr.startsWith("0x")).toBe(true);
  });

  it("should have zero values initially", () => {
    // All struct fields should be zero/empty initially
    expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
    expectHex(SELECTOR.GET_STRUCT_VALUE, pad64(0n));
    expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
    expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(0n));
    expectString(SELECTOR.GET_STRUCT_CONTENTS, "");
  });

  it("should set struct fields and retrieve them", () => {
    // Prepare calldata for setStruct with proper string encoding
    const setStructData = calldataSetStruct(
      TEST_ADDRESS_BIGINT, // to
      TEST_STRING, // contents
      TEST_U256, // value
      true, // flag
      TEST_U256_2, // value2
    );

    // Set the struct values
    castSend(setStructData, "62470600");

    // Verify each field was set correctly
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

    // Set a new struct with different values
    const newSetData = calldataSetStruct(0n, NEW_STRING, NEW_VALUE, false, 77n);

    castSend(newSetData);

    // Verify all fields changed independently
    expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
    expectString(SELECTOR.GET_STRUCT_CONTENTS, NEW_STRING);
    expectHex(SELECTOR.GET_STRUCT_VALUE, NEW_VALUE_PAD);
    expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
    expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(77n));
  });

  it("should handle boolean values correctly", () => {
    // Test true
    const setTrueData = calldataSetStruct(0n, "", 0n, true, 0n);
    castSend(setTrueData);
    expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_TRUE_PAD);

    // Test false
    const setFalseData = calldataSetStruct(0n, "", 0n, false, 0n);
    castSend(setFalseData);
    expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_FALSE_PAD);
  });

  it("should handle empty and long strings", () => {
    const LONG_STRING = "abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()";

    // Test empty string
    const emptySetData = calldataSetStruct(TEST_ADDRESS_BIGINT, "", TEST_U256, true, TEST_U256_2);
    castSend(emptySetData);
    expectString(SELECTOR.GET_STRUCT_CONTENTS, "");

    // Test long string
    const longSetData = calldataSetStruct(
      TEST_ADDRESS_BIGINT,
      LONG_STRING,  // long string
      TEST_U256,
      true,
      TEST_U256_2
    );
    castSend(longSetData);
    expectString(SELECTOR.GET_STRUCT_CONTENTS, LONG_STRING);
  });
});
