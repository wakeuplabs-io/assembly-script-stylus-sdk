// ---------------------------------------------------------------
//  End-to-end tests — StringStorage contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "./client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "./constants.js";
import { setupE2EContract } from "./setup.js";
import { handleDeploymentError } from "./utils.js";

config();

// Constants
const LONG_STRING = "abcdefghijklmnopqrstuvwxyz1234567890!@#";

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.STRING;

/**
 * Deploys the StringStorage contract and initializes the test environment
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

describe("StringStorage — String Operations", () => {
  describe("Basic string storage and retrieval", () => {
    it("should store and retrieve 'hello'", async () => {
      // Set storage to "hello"
      await contract.write(walletClient, "setStorage", ["hello"]);

      // Retrieve and verify
      const result = await contract.read("getStorage", []);
      expect(result).toBe("hello");
    });

    it("should store and retrieve long string (40 bytes)", async () => {
      // Set storage to the long string
      await contract.write(walletClient, "setStorage", [LONG_STRING]);

      // Retrieve and verify
      const result = await contract.read("getStorage", []);
      expect(result).toBe(LONG_STRING);
    });
  });

  describe("String substring operations", () => {
    it("should return correct substring: 'hello'[1,3] == 'ell'", async () => {
      // First set storage to "hello"
      await contract.write(walletClient, "setStorage", ["hello"]);

      // Get substring from position 1 with length 3
      const result = await contract.read("substring", [1n, 3n]);
      expect(result).toBe("ell");
    });

    it("should return correct substring: LONG_STRING[0,2] == 'ab'", async () => {
      // First set storage to the long string
      await contract.write(walletClient, "setStorage", [LONG_STRING]);

      // Get substring from position 0 with length 2
      const result = await contract.read("substring", [0n, 2n]);
      expect(result).toBe("ab");
    });

    it("should handle various substring operations", async () => {
      const testString = "Hello, World!";
      await contract.write(walletClient, "setStorage", [testString]);

      // Test different substring operations
      let result = await contract.read("substring", [0n, 5n]);
      expect(result).toBe("Hello");

      result = await contract.read("substring", [7n, 5n]);
      expect(result).toBe("World");

      result = await contract.read("substring", [12n, 1n]);
      expect(result).toBe("!");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string", async () => {
      await contract.write(walletClient, "setStorage", [""]);

      const result = await contract.read("getStorage", []);
      expect(result).toBe("");
    });

    it("should handle single character strings", async () => {
      await contract.write(walletClient, "setStorage", ["a"]);

      const result = await contract.read("getStorage", []);
      expect(result).toBe("a");
    });

    it("should handle special characters", async () => {
      const specialString = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      await contract.write(walletClient, "setStorage", [specialString]);

      const result = await contract.read("getStorage", []);
      expect(result).toBe(specialString);
    });

    it("should handle Unicode characters", async () => {
      const unicodeString = "Hello 世界 🌍 测试";
      await contract.write(walletClient, "setStorage", [unicodeString]);

      const result = await contract.read("getStorage", []);
      expect(result).toBe(unicodeString);
    });

    it("should handle zero-length substring", async () => {
      await contract.write(walletClient, "setStorage", ["test"]);

      const result = await contract.read("substring", [0n, 0n]);
      expect(result).toBe("");
    });

    it("should handle substring at end of string", async () => {
      const testString = "testing";
      await contract.write(walletClient, "setStorage", [testString]);

      const result = await contract.read("substring", [4n, 3n]);
      expect(result).toBe("ing");
    });
  });

  describe("String overwriting", () => {
    it("should correctly overwrite previous strings", async () => {
      // Set initial string
      await contract.write(walletClient, "setStorage", ["first"]);
      let result = await contract.read("getStorage", []);
      expect(result).toBe("first");

      // Overwrite with longer string
      await contract.write(walletClient, "setStorage", ["second string that is longer"]);
      result = await contract.read("getStorage", []);
      expect(result).toBe("second string that is longer");

      // Overwrite with shorter string
      await contract.write(walletClient, "setStorage", ["short"]);
      result = await contract.read("getStorage", []);
      expect(result).toBe("short");
    });
  });

  describe("Multiple operations sequence", () => {
    it("should handle sequence of operations correctly", async () => {
      // Store initial string
      await contract.write(walletClient, "setStorage", ["Hello, World!"]);

      // Verify storage
      let result = await contract.read("getStorage", []);
      expect(result).toBe("Hello, World!");

      // Test multiple substrings
      result = await contract.read("substring", [0n, 5n]);
      expect(result).toBe("Hello");

      result = await contract.read("substring", [7n, 5n]);
      expect(result).toBe("World");

      // Change storage and test again
      await contract.write(walletClient, "setStorage", ["New Content"]);
      result = await contract.read("getStorage", []);
      expect(result).toBe("New Content");

      result = await contract.read("substring", [0n, 3n]);
      expect(result).toBe("New");

      result = await contract.read("substring", [4n, 7n]);
      expect(result).toBe("Content");
    });
  });
});
