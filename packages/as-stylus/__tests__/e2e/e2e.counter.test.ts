// ---------------------------------------------------------------
//  End-to-end tests — Counter contract (Stylus)
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
const U256_MAX = (1n << 256n) - 1n;
const ZERO = 0n;
const ONE = 1n;

// Test state
let contractAddr = "";
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.COUNTER;
const abi = getAbi(abiPath);

/**
 * Deploys the Counter contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    console.log("🚀 Starting contract deployment...");
    console.log("Contract path:", contractPath);

    // Build and compile the contract
    console.log("📦 Building contract...");
    run("npm run pre:build", PROJECT_ROOT);
    run("npx as-stylus build", contractPath);
    run("npm run compile", contractPath);
    run("npm run check", contractPath);

    // Deploy the contract
    console.log("🚢 Deploying contract...");
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

    // Initialize the contract by calling deploy
    console.log("🔧 Initializing contract...");
    await contract.write(walletClient, "deploy", []);

    console.log("✅ Contract setup completed successfully");
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

describe("Counter (U256) — Operations", () => {
  describe("Underflow and overflow behavior", () => {
    it("should handle underflow: 0 → decrement → MAX → increment → 0", async () => {
      // Check initial value is 0
      let result = await contract.read("get", []);
      expect(result).toBe(ZERO);

      // Decrement from 0 should wrap to MAX
      await contract.write(walletClient, "decrement", []);
      result = await contract.read("get", []);
      expect(result).toBe(U256_MAX);

      // Increment from MAX should wrap back to 0
      await contract.write(walletClient, "increment", []);
      result = await contract.read("get", []);
      expect(result).toBe(ZERO);
    });
  });

  describe("Basic arithmetic operations", () => {
    it("should handle small progression: +1 +1 −1 ⇒ 1", async () => {
      // First increment: 0 → 1
      await contract.write(walletClient, "increment", []);

      // Second increment: 1 → 2
      await contract.write(walletClient, "increment", []);

      // Decrement: 2 → 1
      await contract.write(walletClient, "decrement", []);

      // Should be 1
      const result = await contract.read("get", []);
      expect(result).toBe(ONE);
    });

    it("should correctly increment from current value", async () => {
      // Get current value (should be 1 from previous test)
      let result = await contract.read("get", []);
      const currentValue = result as bigint;

      // Increment
      await contract.write(walletClient, "increment", []);

      // Should be currentValue + 1
      result = await contract.read("get", []);
      expect(result).toBe(currentValue + 1n);
    });

    it("should correctly decrement from current value", async () => {
      // Get current value
      let result = await contract.read("get", []);
      const currentValue = result as bigint;

      // Decrement
      await contract.write(walletClient, "decrement", []);

      // Should be currentValue - 1
      result = await contract.read("get", []);
      expect(result).toBe(currentValue - 1n);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple increments correctly", async () => {
      // Reset to known state (0)
      let result = (await contract.read("get", [])) as bigint;
      while (result !== ZERO) {
        await contract.write(walletClient, "decrement", []);
        result = (await contract.read("get", [])) as bigint;
        // Safety check to avoid infinite loop
        if (result > 10n) break;
      }

      // Perform 5 increments
      for (let i = 0; i < 5; i++) {
        await contract.write(walletClient, "increment", []);
      }

      result = (await contract.read("get", [])) as bigint;
      expect(result).toBe(5n);
    });

    it("should handle multiple decrements correctly", async () => {
      // From current value (5), decrement 3 times
      for (let i = 0; i < 3; i++) {
        await contract.write(walletClient, "decrement", []);
      }

      const result = await contract.read("get", []);
      expect(result).toBe(2n);
    });
  });
});

describe("Counter (U256) — Edge Cases", () => {
  describe("Boundary conditions", () => {
    it("should handle underflow from 0 correctly", async () => {
      // Reset to 0
      await contract.write(walletClient, "set", [ZERO]);

      // Decrement from 0 should wrap to U256_MAX
      await contract.write(walletClient, "decrement", []);
      const result = await contract.read("get", []);
      console.log("result", result);
      expect(result).toBe(U256_MAX);
    });

    it("should handle overflow from U256_MAX correctly", async () => {
      // Set to U256_MAX
      await contract.write(walletClient, "set", [U256_MAX]);

      // Increment from U256_MAX should wrap to 0
      await contract.write(walletClient, "increment", []);
      const result = await contract.read("get", []);
      expect(result).toBe(ZERO);
    });
  });

  describe("Large values and edge cases", () => {
    it("should handle large increments correctly", async () => {
      // Reset to 0
      await contract.write(walletClient, "set", [ZERO]);

      // Increment by a large value
      const largeIncrement = U256_MAX - 100n;
      await contract.write(walletClient, "set", [largeIncrement]);

      // Increment should wrap around correctly
      await contract.write(walletClient, "increment", []);
      const result = await contract.read("get", []);
      expect(result).toBe(largeIncrement + 1n);
    });

    it("should handle large decrements correctly", async () => {
      // Set to a large value
      const largeValue = U256_MAX - 50n;
      await contract.write(walletClient, "set", [largeValue]);

      // Decrement should wrap around correctly
      await contract.write(walletClient, "decrement", []);
      const result = await contract.read("get", []);
      expect(result).toBe(largeValue - 1n);
    });
  });
});
