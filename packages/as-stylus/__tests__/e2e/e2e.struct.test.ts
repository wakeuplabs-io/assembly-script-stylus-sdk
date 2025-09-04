// ---------------------------------------------------------------
//  End-to-end tests — Struct contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient, getAddress } from "viem";

config();

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

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
    contract = await setupE2EContract(contractPath, abiPath, {
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

    it("should get struct info", async () => {
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);

      const info = (await contract.read("getInfo", [])) as {
        to: Address;
        contents: string;
        value: bigint;
        flag: boolean;
        value2: bigint;
      };
      console.log("info", info);
      expect(info.to).toBe(TEST_ADDRESS);
      expect(info.contents).toBe(TEST_STRING);
      expect(info.value).toBe(TEST_U256);
      expect(info.flag).toBe(true);
      expect(info.value2).toBe(TEST_U256_2);
    });
  });

  describe("Memory Operations", () => {
    beforeEach(async () => {
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);
    });

    it("should perform memory operations correctly using individual field methods", async () => {
      const to = (await contract.read("getProcessedStructTo", [])) as Address;
      const contents = (await contract.read("getProcessedStructContents", [])) as string;
      const value = (await contract.read("getProcessedStructValue", [])) as bigint;
      const flag = (await contract.read("getProcessedStructFlag", [])) as boolean;
      const value2 = (await contract.read("getProcessedStructValue2", [])) as bigint;

      expect(to.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
      expect(contents).toBe(TEST_STRING);
      expect(value).toBe(TEST_U256 + 1n);
      expect(flag).toBe(true);
      expect(value2).toBe(TEST_U256);
    });

    it("should handle empty string in memory operations", async () => {
      await contract.write(walletClient, "setStruct", [TEST_ADDRESS, "", 50n, false, 75n]);

      const value = (await contract.read("getProcessedStructValue", [])) as bigint;
      const contents = (await contract.read("getProcessedStructContents", [])) as string;

      expect(value).toBe(51n); // 50 + 1
      expect(contents.length).toBe(0);
    });

    it("should handle long string in memory operations", async () => {
      const long =
        "This is a very long string that exceeds thirty-two characters and should test padding";
      await contract.write(walletClient, "setStruct", [TEST_ADDRESS, long, 123n, true, 456n]);

      const value = (await contract.read("getProcessedStructValue", [])) as bigint;
      const contents = (await contract.read("getProcessedStructContents", [])) as string;

      expect(value).toBe(124n); // 123 + 1
      expect(contents).toBe(long);
    });

    it("should handle zero values in memory operations", async () => {
      await contract.write(walletClient, "setStruct", [ZERO_ADDRESS, "zero", 0n, false, 0n]);

      const to = (await contract.read("getProcessedStructTo", [])) as Address;
      const value = (await contract.read("getProcessedStructValue", [])) as bigint;
      const flag = (await contract.read("getProcessedStructFlag", [])) as boolean;
      const value2 = (await contract.read("getProcessedStructValue2", [])) as bigint;

      expect(to).toBe(ZERO_ADDRESS);
      expect(value).toBe(1n); // 0 + 1
      expect(flag).toBe(false);
      expect(value2).toBe(0n); // Set to original value (0)
    });

    it("should validate string length & content", async () => {
      const contents = (await contract.read("getProcessedStructContents", [])) as string;

      expect(contents.length).toBeGreaterThan(0);
      expect(contents.length).toBeLessThan(1000);
      expect(contents).toContain("Hello");
    });

    it("should verify memory operations don't affect storage", async () => {
      // Set initial storage state
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        "Original storage",
        100n,
        true,
        200n,
      ]);

      // Read initial storage state
      const initialValue = (await contract.read("getStructValue", [])) as bigint;
      const initialContents = (await contract.read("getStructContents", [])) as string;

      // Perform memory operations multiple times
      for (let i = 0; i < 3; i++) {
        const memoryValue = (await contract.read("getProcessedStructValue", [])) as bigint;
        const memoryContents = (await contract.read("getProcessedStructContents", [])) as string;

        // Memory operations should show modified values
        expect(memoryValue).toBe(101n); // 100 + 1
        expect(memoryContents).toBe(initialContents);
      }

      // Storage should remain unchanged
      const finalValue = (await contract.read("getStructValue", [])) as bigint;
      const finalContents = (await contract.read("getStructContents", [])) as string;

      expect(finalValue).toBe(initialValue);
      expect(finalContents).toBe(initialContents);
    });
  });

  describe("Edge Cases & Comprehensive Testing", () => {
    it("should handle maximum U256 values", async () => {
      const MAX_U256 = 2n ** 256n - 1n;
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        "Max U256 test",
        MAX_U256,
        true,
        MAX_U256,
      ]);

      const value = (await contract.read("getStructValue", [])) as bigint;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;

      expect(value).toBe(MAX_U256);
      expect(value2).toBe(MAX_U256);
    });

    it("should handle minimum U256 values (zero)", async () => {
      await contract.write(walletClient, "setStruct", [ZERO_ADDRESS, "", 0n, false, 0n]);

      const value = (await contract.read("getStructValue", [])) as bigint;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;

      expect(value).toBe(0n);
      expect(value2).toBe(0n);
    });

    it("should handle special addresses", async () => {
      const SPECIAL_ADDRESSES = [
        "0x0000000000000000000000000000000000000000", // Zero address
        "0x1234567890123456789012345678901234567890", // Test pattern
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Mixed case (lowercase)
        "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // Common test pattern
      ];

      for (const rawAddr of SPECIAL_ADDRESSES) {
        // Use getAddress to ensure proper checksum
        const testAddr = getAddress(rawAddr);

        await contract.write(walletClient, "setStruct", [
          testAddr,
          `Test for ${testAddr}`,
          42n,
          true,
          84n,
        ]);

        const retrievedAddr = (await contract.read("getStructTo", [])) as Address;
        expect(retrievedAddr.toLowerCase()).toBe(testAddr.toLowerCase());
      }
    });

    it("should handle unicode and special characters in strings", async () => {
      const SPECIAL_STRINGS = [
        "Hello 世界!", // Unicode
        "🚀🌟💻", // Emojis
        "Test with\nnewlines\tand\ttabs", // Control characters
        "\"Quotes\" and 'apostrophes'", // Quotes
        "\\Backslashes\\ and /slashes/", // Slashes
        "", // Empty string
        " ", // Just space
        "a".repeat(100), // Long string
      ];

      for (const testString of SPECIAL_STRINGS) {
        await contract.write(walletClient, "setStruct", [
          TEST_ADDRESS,
          testString,
          123n,
          true,
          456n,
        ]);

        const retrievedString = (await contract.read("getStructContents", [])) as string;
        expect(retrievedString).toBe(testString);
      }
    });

    it("should handle rapid successive updates", async () => {
      const ITERATIONS = 5;
      for (let i = 0; i < ITERATIONS; i++) {
        await contract.write(walletClient, "setStruct", [
          `0x${i.toString(16).padStart(40, "0")}` as Address,
          `Iteration ${i}`,
          BigInt(i * 100),
          i % 2 === 0,
          BigInt(i * 200),
        ]);

        // Verify each update
        const value = (await contract.read("getStructValue", [])) as bigint;
        const contents = (await contract.read("getStructContents", [])) as string;
        const flag = (await contract.read("getStructFlag", [])) as boolean;

        expect(value).toBe(BigInt(i * 100));
        expect(contents).toBe(`Iteration ${i}`);
        expect(flag).toBe(i % 2 === 0);
      }
    });

    it("should verify storage persistence across operations", async () => {
      // Set initial storage state
      await contract.write(walletClient, "setStruct", [
        TEST_ADDRESS,
        "Persistent storage",
        100n,
        true,
        200n,
      ]);

      // Read initial state
      const initialValue = (await contract.read("getStructValue", [])) as bigint;
      const initialContents = (await contract.read("getStructContents", [])) as string;

      // Perform multiple reads to verify consistency
      for (let i = 0; i < 3; i++) {
        const value = (await contract.read("getStructValue", [])) as bigint;
        const contents = (await contract.read("getStructContents", [])) as string;

        expect(value).toBe(initialValue);
        expect(contents).toBe(initialContents);
      }

      // Storage should remain unchanged
      const finalValue = (await contract.read("getStructValue", [])) as bigint;
      const finalContents = (await contract.read("getStructContents", [])) as string;

      expect(finalValue).toBe(initialValue);
      expect(finalContents).toBe(initialContents);
    });

    it("should handle boolean flag combinations", async () => {
      const testCases = [
        { flag: true, expected: true },
        { flag: false, expected: false },
      ];

      for (const testCase of testCases) {
        await contract.write(walletClient, "setStruct", [
          TEST_ADDRESS,
          `Flag test: ${testCase.flag}`,
          42n,
          testCase.flag,
          84n,
        ]);

        const retrievedFlag = (await contract.read("getStructFlag", [])) as boolean;
        expect(retrievedFlag).toBe(testCase.expected);
      }
    });

    it("should verify field independence in storage operations", async () => {
      // Set up initial state with known values
      const testAddr = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

      await contract.write(walletClient, "setStruct", [
        testAddr,
        "Field independence test",
        500n,
        true,
        1000n,
      ]);

      // Verify all fields were set correctly and independently
      const to = (await contract.read("getStructTo", [])) as Address;
      const contents = (await contract.read("getStructContents", [])) as string;
      const value = (await contract.read("getStructValue", [])) as bigint;
      const flag = (await contract.read("getStructFlag", [])) as boolean;
      const value2 = (await contract.read("getStructValue2", [])) as bigint;

      expect(to.toLowerCase()).toBe(testAddr.toLowerCase());
      expect(contents).toBe("Field independence test");
      expect(value).toBe(500n);
      expect(flag).toBe(true);
      expect(value2).toBe(1000n);
    });
  });
});
