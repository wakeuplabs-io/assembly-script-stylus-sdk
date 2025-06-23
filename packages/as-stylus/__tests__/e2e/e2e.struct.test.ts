// ---------------------------------------------------------------
//  End-to-end tests — Struct contract (Stylus)
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
  DEPLOY: "0x775c300c",
  SET_STRUCT: "0x8a9b82c4", // setStruct(address,string,uint256,bool,uint256)
  GET_STRUCT_TO: "0x4b97e1f8", // getStructTo()
  GET_STRUCT_CONTENTS: "0x9a8c9b7d", // getStructContents()
  GET_STRUCT_VALUE: "0x6b4d2a1c", // getStructValue()
  GET_STRUCT_FLAG: "0x7c5e3f8a", // getStructFlag()
  GET_STRUCT_VALUE2: "0x8d6f4b2e", // getStructValue2()
};

// Test data
const TEST_ADDRESS_BIGINT = 0x1234567890123456789012345678901234567890n;
const TEST_U256 = 42n;
const TEST_U256_2 = 100n;

// Padded values for testing
const ZERO_ADDRESS = "0x" + "0".repeat(64);
const TEST_ADDRESS_PAD = pad64(TEST_ADDRESS_BIGINT);
const TEST_U256_PAD = pad64(TEST_U256);
const TEST_U256_2_PAD = pad64(TEST_U256_2);
const BOOL_TRUE_PAD = pad64(1n);

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    run("npm run pre:build", projectRoot);
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/struct");
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

const castSend = (sel: string) => helpers.sendData(sel);
const castCall = (sel: string) => helpers.callData(sel);
const expectHex = (sel: string, hex: string) =>
  expect(castCall(sel).toLowerCase()).toBe(hex.toLowerCase());

describe.skip("Struct Contract — field operations", () => {
  it("should deploy successfully", () => {
    expect(contractAddr).toBeTruthy();
    expect(contractAddr.startsWith("0x")).toBe(true);
  });

  it("should have zero values initially", () => {
    // All struct fields should be zero/empty initially
    expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
    expectHex(SELECTOR.GET_STRUCT_VALUE, pad64(0n));
    expectHex(SELECTOR.GET_STRUCT_FLAG, pad64(0n));
    expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(0n));
  });

  it("should set struct fields and retrieve them", () => {
    // Prepare calldata for setStruct
    const setStructData = calldata(
      SELECTOR.SET_STRUCT,
      TEST_ADDRESS_PAD, // to
      // TODO: String encoding might need special handling
      pad64(TEST_U256), // value
      BOOL_TRUE_PAD, // flag
      pad64(TEST_U256_2), // value2
    );

    // Set the struct values
    castSend(setStructData);

    // Verify each field was set correctly
    expectHex(SELECTOR.GET_STRUCT_TO, TEST_ADDRESS_PAD);
    expectHex(SELECTOR.GET_STRUCT_VALUE, TEST_U256_PAD);
    expectHex(SELECTOR.GET_STRUCT_FLAG, BOOL_TRUE_PAD);
    expectHex(SELECTOR.GET_STRUCT_VALUE2, TEST_U256_2_PAD);
  });

  it("should modify individual fields independently", () => {
    const NEW_VALUE = 999n;
    const NEW_VALUE_PAD = pad64(NEW_VALUE);

    // Set a new struct with different values
    const newSetData = calldata(
      SELECTOR.SET_STRUCT,
      ZERO_ADDRESS, // to (reset to zero)
      pad64(NEW_VALUE), // value (new value)
      pad64(0n), // flag (false)
      pad64(77n), // value2 (different value)
    );

    castSend(newSetData);

    // Verify all fields changed independently
    expectHex(SELECTOR.GET_STRUCT_TO, ZERO_ADDRESS);
    expectHex(SELECTOR.GET_STRUCT_VALUE, NEW_VALUE_PAD);
    expectHex(SELECTOR.GET_STRUCT_FLAG, pad64(0n));
    expectHex(SELECTOR.GET_STRUCT_VALUE2, pad64(77n));
  });

  it("should handle boolean values correctly", () => {
    // Test true
    const setTrueData = calldata(
      SELECTOR.SET_STRUCT,
      ZERO_ADDRESS,
      pad64(0n),
      pad64(1n), // true
      pad64(0n),
    );
    castSend(setTrueData);
    expectHex(SELECTOR.GET_STRUCT_FLAG, pad64(1n));

    // Test false
    const setFalseData = calldata(
      SELECTOR.SET_STRUCT,
      ZERO_ADDRESS,
      pad64(0n),
      pad64(0n), // false
      pad64(0n),
    );
    castSend(setFalseData);
    expectHex(SELECTOR.GET_STRUCT_FLAG, pad64(0n));
  });
});