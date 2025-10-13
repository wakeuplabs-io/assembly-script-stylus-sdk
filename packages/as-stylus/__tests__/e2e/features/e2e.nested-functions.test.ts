// ---------------------------------------------------------------
//  End-to-end tests — Nested functions contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.NESTED_FUNCTIONS;

/**
 * Deploys the StringStorage contract and initializes the test environment
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

describe("Nested Functions — E2E Tests", () => {
  // Reset counters before each complex test
  beforeEach(async () => {
    await contract.write(walletClient, "resetCounters", []);
  });

  describe("Basic nested function calls", () => {
    it("string returned from nested function", async () => {
      const result = await contract.read("getStringExternal", []);
      expect(result).toBe("Hello, world!");
    });

    it("boolean returned from nested function", async () => {
      const result = await contract.read("getBooleanExternal", []);
      expect(result).toBe(true);
    });

    it("number returned from nested function", async () => {
      const result = await contract.read("getIncremented", [0n]);
      expect(result).toBe(1n);
    });

    it("address returned from nested function", async () => {
      const result = await contract.read("getAddressExternal", []);
      expect(result).toBe("0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E");
    });

    it("should be able to call nested functions", async () => {
      const result = await contract.read("incrementThreeTimes", [0n]);
      expect(result).toBe(3n);
    });
  });

  describe("Complex loop operations with inline literals", () => {
    it("tripleIncrement should perform 3 iterations each for unsigned and signed counters", async () => {
      // Initial state: both counters at 0
      expect(await contract.read("getUnsignedCounter", [])).toBe(0n);
      expect(await contract.read("getSignedCounter", [])).toBe(0n);

      // Execute tripleIncrement
      await contract.write(walletClient, "tripleIncrement", []);

      // Verify results:
      // unsignedCounter: 3 iterations × stepSize(5) = 15
      // signedCounter: 3 iterations × 1 = 3
      expect(await contract.read("getUnsignedCounter", [])).toBe(15n);
      expect(await contract.read("getSignedCounter", [])).toBe(3n);
    });

    it("bulkIncrement should handle small iterations correctly", async () => {
      // Test with 5 iterations
      await contract.write(walletClient, "bulkIncrement", [5n]);

      // Verify results:
      // unsignedCounter: 5 iterations × stepSize(5) = 25
      // signedCounter: first 2 iterations +1 each, next 3 iterations -2 each = 2 + (-6) = -4
      expect(await contract.read("getUnsignedCounter", [])).toBe(25n);
      expect(await contract.read("getSignedCounter", [])).toBe(-4n);
    });

    it("bulkIncrement should respect maxIterations limit", async () => {
      // Test with value above maxIterations (100)
      await contract.write(walletClient, "bulkIncrement", [150n]);

      // Should only execute 100 iterations (maxIterations)
      // unsignedCounter: 100 iterations × stepSize(5) = 500
      // signedCounter: first 2 iterations +1 each, next 98 iterations -2 each = 2 + (-196) = -194
      expect(await contract.read("getUnsignedCounter", [])).toBe(500n);
      expect(await contract.read("getSignedCounter", [])).toBe(-194n);
    });

    it("bulkIncrement should handle edge case with 1 iteration", async () => {
      await contract.write(walletClient, "bulkIncrement", [1n]);

      // Only 1 iteration:
      // unsignedCounter: 1 × stepSize(5) = 5
      // signedCounter: iterator(0) < 2, so +1 = 1
      expect(await contract.read("getUnsignedCounter", [])).toBe(5n);
      expect(await contract.read("getSignedCounter", [])).toBe(1n);
    });

    it("bulkIncrement should handle edge case with 2 iterations", async () => {
      await contract.write(walletClient, "bulkIncrement", [2n]);

      // 2 iterations:
      // unsignedCounter: 2 × stepSize(5) = 10
      // signedCounter: both iterations have iterator < 2, so +1 each = 2
      expect(await contract.read("getUnsignedCounter", [])).toBe(10n);
      expect(await contract.read("getSignedCounter", [])).toBe(2n);
    });

    it("bulkIncrement should handle zero iterations", async () => {
      await contract.write(walletClient, "bulkIncrement", [0n]);

      // No iterations should occur
      expect(await contract.read("getUnsignedCounter", [])).toBe(0n);
      expect(await contract.read("getSignedCounter", [])).toBe(0n);
    });
  });

  describe("Complex calculation with inline operations", () => {
    it("complexCalculation should perform correct sequence of operations", async () => {
      // Starting with baseValue = 100
      const result = await contract.read("complexCalculation", [100n]);

      // Expected calculation steps (multiplier 0-4):
      // Step 0 (multiplier=0): 100 + 10 = 110
      // Step 1 (multiplier=1): 110 × 2 = 220
      // Step 2 (multiplier=2): 220 - 3 = 217
      // Step 3 (multiplier=3): 217 ÷ 2 = 108 (integer division)
      // Step 4 (multiplier=4): 108 + 7 = 115
      expect(result).toBe(115n);
    });

    it("complexCalculation should handle edge case with zero", async () => {
      const result = await contract.read("complexCalculation", [0n]);

      // Expected calculation steps starting with 0:
      // Step 0: 0 + 10 = 10
      // Step 1: 10 × 2 = 20
      // Step 2: 20 - 3 = 17
      // Step 3: 17 ÷ 2 = 8
      // Step 4: 8 + 7 = 15
      expect(result).toBe(15n);
    });

    it("complexCalculation should demonstrate nested calls in loops", async () => {
      const testNumber = 50000n; // Moderate size to demonstrate nested calls efficiently
      // Use high gas limit to accommodate nested function calls in loops
      const result = await contract.read("complexCalculation", [testNumber], 30000000n);

      // Expected calculation steps with nested factory calls:
      // Step 0: 50000 + 10 = 50010 (nested: result.add(U256Factory.fromString("10")))
      // Step 1: 50010 × 2 = 100020 (constant: result.mul(two))
      // Step 2: 100020 - 3 = 100017 (constant: result.sub(three))
      // Step 3: 100017 ÷ 2 = 50008 (nested: result.div(U256Factory.fromString("2")))
      // Step 4: 50008 + 7 = 50015 (nested: result.add(U256Factory.fromString("7")))
      expect(result).toBe(50015n);
    });
  });

  describe("State persistence between calls", () => {
    it("multiple tripleIncrement calls should accumulate", async () => {
      // First call
      await contract.write(walletClient, "tripleIncrement", []);
      expect(await contract.read("getUnsignedCounter", [])).toBe(15n);
      expect(await contract.read("getSignedCounter", [])).toBe(3n);

      // Second call should accumulate
      await contract.write(walletClient, "tripleIncrement", []);
      expect(await contract.read("getUnsignedCounter", [])).toBe(30n);
      expect(await contract.read("getSignedCounter", [])).toBe(6n);
    });

    it("mixed operations should accumulate correctly", async () => {
      // tripleIncrement first
      await contract.write(walletClient, "tripleIncrement", []);
      expect(await contract.read("getUnsignedCounter", [])).toBe(15n);
      expect(await contract.read("getSignedCounter", [])).toBe(3n);

      // bulkIncrement with 3 iterations
      await contract.write(walletClient, "bulkIncrement", [3n]);
      // unsignedCounter: 15 + (3 × 5) = 30
      // signedCounter: 3 + (2 × 1) + (1 × -2) = 3 + 2 - 2 = 3
      expect(await contract.read("getUnsignedCounter", [])).toBe(30n);
      expect(await contract.read("getSignedCounter", [])).toBe(3n);
    });
  });

  describe("Moderate Complexity Stress Test", () => {
    it("moderateComplexityTest should handle step-by-step operations correctly", async () => {
      const result = await contract.read("moderateComplexityTest", [50n]);

      // Manual calculation for verification:
      // counter=0: result=50, 50 > 10 → increment = 5*(2+0) = 10, result = 50 + 10 = 60
      // counter=1: result=60, 60 > 10 → increment = 5*(2+1) = 15, result = 60 + 15 = 75
      expect(result).toBe(75n);
    });

    it("moderateComplexityTest should handle small input triggering else branch", async () => {
      const result = await contract.read("moderateComplexityTest", [5n]);

      // counter=0: result=5, 5 <= 10 → result = 5*3/2 = 15/2 = 7 (integer division)
      // counter=1: result=7, 7 <= 10 → result = 7*3/2 = 21/2 = 10 (integer division)
      expect(result).toBe(10n);
    });
  });
});
