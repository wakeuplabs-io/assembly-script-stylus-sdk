// ---------------------------------------------------------------
//  End-to-end tests — Storage contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "./client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PROJECT_ROOT,
} from "./constants.js";
import { getAbi, PRIVATE_KEY, run, stripAnsi } from "./utils.js";

config();

// Constants
const INIT_VALUE = 5n;
const ADD_VALUE = 3n;
const SUB_VALUE = 2n;
const EXPECTED_AFTER_ADD = INIT_VALUE + ADD_VALUE; // 8

// Test state
let contractAddr = "";
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.STORAGE;

/**
 * Deploys the Storage contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    // Build and compile the contract
    run("npm run pre:build", PROJECT_ROOT);
    run("npx as-stylus build", contractPath);
    run("npm run compile", contractPath);
    run("npm run check", contractPath);
    const abi = getAbi(abiPath);

    // Deploy the contract
    const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, contractPath));

    // Extract contract address from deployment logs
    const addressMatch = deployLog.match(CONTRACT_ADDRESS_REGEX);
    if (!addressMatch) {
      throw new Error(`Could not extract contract address from deployment log: ${deployLog}`);
    }

    contractAddr = addressMatch[1];
    console.log("📍 Contract deployed at:", contractAddr);

    // Initialize contract service
    contract = contractService(contractAddr as Address, abi);

    // Initialize the contract by calling deploy with initial value
    await contract.write(walletClient, "deploy", [INIT_VALUE]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to deploy contract:", errorMessage);

    // Add more context to the error
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }

    throw new Error(`Contract deployment failed: ${errorMessage}`);
  }
}, DEPLOY_TIMEOUT);

describe("Storage (U256) — Operations", () => {
  describe("Initial state", () => {
    it("should return initial value after deploy", async () => {
      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(INIT_VALUE);
    });
  });

  describe("Addition operations", () => {
    it("should correctly add value to storage", async () => {
      // Add 3 to current value (5)
      await contract.write(walletClient, "add", [ADD_VALUE]);

      // Should now be 8
      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(EXPECTED_AFTER_ADD);
    });

    it("should handle multiple additions", async () => {
      // Get current value
      let currentValue = (await contract.read("get", [])) as bigint;

      // Add 1 multiple times
      for (let i = 0; i < 3; i++) {
        await contract.write(walletClient, "add", [1n]);
        currentValue += 1n;
      }

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue);
    });
  });

  describe("Subtraction operations", () => {
    it("should correctly subtract value from storage", async () => {
      // Get current value and subtract 2
      const currentValue = (await contract.read("get", [])) as bigint;
      await contract.write(walletClient, "sub", [SUB_VALUE]);

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue - SUB_VALUE);
    });

    it("should handle multiple subtractions", async () => {
      // Get current value
      let currentValue = (await contract.read("get", [])) as bigint;

      // Subtract 1 multiple times
      for (let i = 0; i < 2; i++) {
        await contract.write(walletClient, "sub", [1n]);
        currentValue -= 1n;
      }

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue);
    });
  });

  describe("Edge cases and large values", () => {
    it("should handle large addition values", async () => {
      const currentValue = (await contract.read("get", [])) as bigint;
      const largeValue = 1000000n;

      await contract.write(walletClient, "add", [largeValue]);

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue + largeValue);
    });

    it("should handle large subtraction values", async () => {
      const currentValue = (await contract.read("get", [])) as bigint;
      const largeValue = 500000n;

      await contract.write(walletClient, "sub", [largeValue]);

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue - largeValue);
    });

    it("should handle zero operations", async () => {
      const currentValue = (await contract.read("get", [])) as bigint;

      // Add zero should not change value
      await contract.write(walletClient, "add", [0n]);
      let result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue);

      // Subtract zero should not change value
      await contract.write(walletClient, "sub", [0n]);
      result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue);
    });

    it("should handle U256 boundary values", async () => {
      const U256_MAX = (1n << 256n) - 1n;

      // Reset to a known large value first by getting current and adding to reach near max
      const currentValue = (await contract.read("get", [])) as bigint;
      const valueToAdd = U256_MAX - currentValue - 100n; // Leave some room for testing

      await contract.write(walletClient, "add", [valueToAdd]);

      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(U256_MAX - 100n);
    });
  });

  describe("Sequential operations", () => {
    it("should follow original test sequence: init(5) → add(3) → sub(2)", async () => {
      // Reset to initial state by getting current value and calculating what to add/subtract
      const currentValue = (await contract.read("get", [])) as bigint;

      // If not at expected value, reset by subtracting difference
      if (currentValue !== INIT_VALUE) {
        const diff = currentValue - INIT_VALUE;
        await contract.write(walletClient, "sub", [diff]);
      }

      // Verify we're at initial value
      let result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(INIT_VALUE);

      // Add 3 (should be 8)
      await contract.write(walletClient, "add", [ADD_VALUE]);
      result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(EXPECTED_AFTER_ADD);

      // Subtract 2 (should be 6)
      await contract.write(walletClient, "sub", [SUB_VALUE]);
      result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(EXPECTED_AFTER_ADD - SUB_VALUE);
    });

    it("should handle complex sequences of operations", async () => {
      // Reset to known state
      const currentValue = (await contract.read("get", [])) as bigint;

      // Perform sequence: +10, -3, +5, -2
      await contract.write(walletClient, "add", [10n]);
      await contract.write(walletClient, "sub", [3n]);
      await contract.write(walletClient, "add", [5n]);
      await contract.write(walletClient, "sub", [2n]);

      // Expected: currentValue + 10 - 3 + 5 - 2 = currentValue + 10
      const result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(currentValue + 10n);
    });
  });
});
