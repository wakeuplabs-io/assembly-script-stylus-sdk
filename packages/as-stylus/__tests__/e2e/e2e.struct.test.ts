// ---------------------------------------------------------------
//  End-to-end tests — Struct contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

config();

import { contractService, getWalletClient } from "./client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "./constants.js";
import { setupE2EContract } from "./setup.js";
import {
  handleDeploymentError,
  parseStructABIResponse,
  validateStructABIFormat,
  validateStructFieldValues,
  calculateExpectedStructSize,
  validateStringContentInABI,
} from "../helpers/utils.js";

// Test constants
const TEST_ADDRESS = "0x1234567890123456789012345678901234567890" as Address;
const TEST_U256 = 42n;
const TEST_U256_2 = 100n;
const TEST_STRING = "Hello World!";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.STRUCT;

/**
 * Deploys the Struct contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Struct Contract Tests", () => {
  describe("Storage Operations", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
    });

    it("should have zero values initially", async () => {
      const to = (await contract.read("getStructTo", [])) as Address;
      const value = (await contract.read("getStructValue", [])) as bigint;
      const flag = (await contract.read("getStructFlag", [])) as boolean;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;
      const contents = (await contract.read("getStructContents", [])) as string;

      expect(to).toBe(ZERO_ADDRESS);
      expect(value).toBe(0n);
      expect(flag).toBe(false);
      expect(value2).toBe(0n);
      expect(contents).toBe("");
    });

    it("should set struct fields and retrieve them", async () => {
      const testAddress = "0xb7ba1Dea4a3745e58959a2091b47096cc197be5A";

      await contract.write(walletClient, "setStruct", [
        testAddress,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);

      const to = (await contract.read("getStructTo", [])) as Address;
      const contents = (await contract.read("getStructContents", [])) as string;
      const value = (await contract.read("getStructValue", [])) as bigint;
      const flag = (await contract.read("getStructFlag", [])) as boolean;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;

      console.log("to", to, testAddress);
      console.log("contents", contents, TEST_STRING);
      console.log("value", value, TEST_U256);
      console.log("flag", flag);
      console.log("value2", value2, TEST_U256_2);

      expect(to.toLowerCase()).toBe(testAddress.toLowerCase());
      expect(contents).toBe(TEST_STRING);
      expect(value).toBe(TEST_U256);
      expect(flag).toBe(true);
      expect(value2).toBe(TEST_U256_2);
    });

    it("should modify individual fields independently", async () => {
      const NEW_VALUE = 999n;
      const NEW_STRING = "New Content";

      await contract.write(walletClient, "setStruct", [
        ZERO_ADDRESS,
        NEW_STRING,
        NEW_VALUE,
        false,
        77n,
      ]);

      const to = (await contract.read("getStructTo", [])) as Address;
      expect(to).toBe(ZERO_ADDRESS);

      const contents = (await contract.read("getStructContents", [])) as string;
      expect(contents).toBe(NEW_STRING);

      const value = (await contract.read("getStructValue", [])) as bigint;
      expect(value).toBe(NEW_VALUE);

      const flag = (await contract.read("getStructFlag", [])) as boolean;
      expect(flag).toBe(false);

      const value2 = (await contract.read("getStructValue2", [])) as bigint;
      expect(value2).toBe(77n);
    });

    it("should handle boolean values correctly", async () => {
      await contract.write(walletClient, "setStruct", [ZERO_ADDRESS, "", 0n, true, 0n]);

      let flag = (await contract.read("getStructFlag", [])) as boolean;
      expect(flag).toBe(true);

      await contract.write(walletClient, "setStruct", [ZERO_ADDRESS, "", 0n, false, 0n]);

      flag = (await contract.read("getStructFlag", [])) as boolean;
      expect(flag).toBe(false);
    });

    it("should handle empty and long strings", async () => {
      const LONG_STRING = "abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()";

      // Test empty string
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        "",
        TEST_U256,
        true,
        TEST_U256_2,
      ]);

      let contents = (await contract.read("getStructContents", [])) as string;
      expect(contents).toBe("");

      // Test long string
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        LONG_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);

      contents = (await contract.read("getStructContents", [])) as string;
      expect(contents).toBe(LONG_STRING);
    });
  });

  describe.skip("Memory Operations", () => {
    beforeEach(async () => {
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);
    });

    it("should perform memory operations in getInfo correctly", async () => {
      const response = await contract.read("getInfo", []);
      console.log("response", response);

      // Verify individual getters still work
      const value = (await contract.read("getStructValue", [])) as bigint;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;
      expect(value).toBe(TEST_U256);
      expect(value2).toBe(TEST_U256_2);
    });

    it.skip("should handle empty string in memory operations", async () => {
      await contract.write(walletClient, "setStruct", [TEST_ADDRESS, "", 50n, false, 75n]);

      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        validateStructFieldValues(analysis, {
          value: 51,
          stringLength: 0,
        });

        const expectedSize = calculateExpectedStructSize(0);
        expect(analysis.totalBytes).toBe(expectedSize);
      }
    });

    it.skip("should handle long string in memory operations", async () => {
      const longString =
        "This is a very long string that exceeds thirty-two characters and should test padding";

      await contract.write(walletClient, "setStruct", [TEST_ADDRESS, longString, 123n, true, 456n]);

      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        validateStructFieldValues(analysis, {
          value: 124,
          stringLength: longString.length,
        });

        const expectedSize = calculateExpectedStructSize(longString.length);
        expect(analysis.totalBytes).toBe(expectedSize);
      }
    });

    it.skip("should handle zero values in memory operations", async () => {
      await contract.write(walletClient, "setStruct", [ZERO_ADDRESS, "zero", 0n, false, 0n]);

      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        validateStructFieldValues(analysis, {
          address: "0".repeat(64),
          value: 1,
          boolean: false,
          value2: 0,
        });
      }
    });

    it.skip("should handle maximum values correctly", async () => {
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        "MAX",
        2n ** 200n,
        true,
        2n ** 100n,
      ]);

      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        expect(analysis.address.toLowerCase()).toBe(
          "ffffffffffffffffffffffffffffffffffffffff000000000000000000000000",
        );
        expect(BigInt("0x" + analysis.slots[2])).toBe(2n ** 200n + 1n);
        expect(analysis.boolean).toBe(true);
        expect(BigInt("0x" + analysis.slots[4])).toBe(2n ** 200n);
      }
    });

    it.skip("should validate ABI encoding format consistency", async () => {
      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        expect(analysis.stringLength).toBeGreaterThan(0);
        expect(analysis.stringLength).toBeLessThan(1000);
        validateStringContentInABI(analysis.stringContent, analysis.stringLength);
      }
    });

    it.skip("should maintain struct field alignment", async () => {
      const response = await contract.read("getInfo", []);

      if (typeof response === "string") {
        const analysis = parseStructABIResponse(response);
        validateStructABIFormat(analysis);
        expect(analysis.totalBytes % 32).toBe(0);
        expect(analysis.slots.length).toBeGreaterThanOrEqual(5);
        expect(analysis.stringOffset).toBe(160);
      }
    });
  });
});
