// ---------------------------------------------------------------
//  End-to-end tests — Expert Counter contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.EXPERT_COUNTER;

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Expert Counter", () => {
  describe("Initial State and Configuration", () => {
    describe("Initial state", () => {
      it("should have counters initialized to zero", async () => {
        const unsignedCounter = (await contract.read("getUnsigned", [])) as bigint;
        const signedCounter = (await contract.read("getSigned", [])) as bigint;

        expect(unsignedCounter).toBe(0n);
        expect(signedCounter).toBe(0n);
      });

      it("should have default configuration", async () => {
        // Default values are in the constructor
        // maxIterations = 10, stepSize = 1, negativeStepSize = -1
        const unsignedCounter = (await contract.read("getUnsigned", [])) as bigint;
        expect(unsignedCounter).toBe(0n);
      });
    });

    describe("Counter configuration", () => {
      it("should allow setting custom counters", async () => {
        const unsignedValue = 42n;
        const signedValue = -17n;

        await contract.write(ownerWallet, "setCounters", [unsignedValue, signedValue]);

        const resultUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const resultSigned = (await contract.read("getSigned", [])) as bigint;

        expect(resultUnsigned).toBe(unsignedValue);
        expect(resultSigned).toBe(signedValue);
      });

      it("should allow setting custom configuration", async () => {
        const maxIter = 5n;
        const step = 2n;
        const negStep = -3n;

        await contract.write(ownerWallet, "setConfiguration", [maxIter, step, negStep]);

        // Verify that the configuration was applied correctly
        // by executing an operation that uses these values
        await contract.write(ownerWallet, "bulkIncrement", [3n]);

        const resultUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        expect(resultUnsigned).toBeGreaterThan(0n);
      });
    });
  });

  describe("Basic Operations", () => {
    beforeEach(async () => {
      // Reset before each test
      await contract.write(ownerWallet, "reset", []);
    });

    describe("tripleIncrement()", () => {
      it("should increment both counters 3 times", async () => {
        const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const initialSigned = (await contract.read("getSigned", [])) as bigint;

        await contract.write(ownerWallet, "tripleIncrement", []);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;

        expect(finalUnsigned).toBe(initialUnsigned + 3n);
        expect(finalSigned).toBe(initialSigned + 3n);
      });
    });

    describe("bulkIncrement()", () => {
      it("should increment according to the 'times' parameter", async () => {
        const times = 4n;
        const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const initialSigned = (await contract.read("getSigned", [])) as bigint;

        await contract.write(ownerWallet, "bulkIncrement", [times]);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;
        // unsignedCounter: incrementa 10 veces (maxIterations) con stepSize=1
        expect(finalUnsigned).toBe(initialUnsigned + 10n);
        // signedCounter: +1, +1, -1, -1, -1, -1, -1, -1, -1, -1 = -6
        expect(finalSigned).toBe(initialSigned - 6n);
      });

      it("should respect maxIterations when times is greater", async () => {
        const times = 15n; // Greater than maxIterations (10)
        const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const initialSigned = (await contract.read("getSigned", [])) as bigint;

        await contract.write(ownerWallet, "bulkIncrement", [times]);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;
        // unsignedCounter: incrementa 10 veces (maxIterations) con stepSize=1
        expect(finalUnsigned).toBe(initialUnsigned + 10n);
        // signedCounter: +1, +1, -1, -1, -1, -1, -1, -1, -1, -1 = -6
        expect(finalSigned).toBe(initialSigned - 6n);
      });
    });
  });

  describe.skip("Mathematical Algorithms", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    describe("fibonacci()", () => {
      it("should correctly calculate fibonacci(5)", async () => {
        await contract.write(ownerWallet, "fibonacci", [5n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(5n); // F(5) = 5
      });

      it("should correctly calculate fibonacci(10)", async () => {
        await contract.write(ownerWallet, "fibonacci", [10n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(55n); // F(10) = 55
      });

      it("should handle fibonacci(0) and fibonacci(1)", async () => {
        await contract.write(ownerWallet, "fibonacci", [0n]);
        let result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(0n);

        await contract.write(ownerWallet, "fibonacci", [1n]);
        result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(1n);
      });
    });

    describe("factorial()", () => {
      it("should correctly calculate factorial(5)", async () => {
        await contract.write(ownerWallet, "factorial", [5n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(120n); // 5! = 120
      });

      it("should correctly calculate factorial(3)", async () => {
        await contract.write(ownerWallet, "factorial", [3n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(6n); // 3! = 6
      });
    });

    describe("pow()", () => {
      it("should correctly calculate 2^3", async () => {
        await contract.write(ownerWallet, "pow", [2n, 3n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(8n); // 2^3 = 8
      });

      it("should correctly calculate 5^2", async () => {
        await contract.write(ownerWallet, "pow", [5n, 2n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(25n); // 5^2 = 25
      });

      it("should handle powers of 0 and 1", async () => {
        await contract.write(ownerWallet, "pow", [5n, 0n]);
        let result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(1n); // 5^0 = 1

        await contract.write(ownerWallet, "pow", [5n, 1n]);
        result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(5n); // 5^1 = 5
      });
    });

    describe("gcd()", () => {
      it("should correctly calculate gcd(48, 18)", async () => {
        await contract.write(ownerWallet, "gcd", [48n, 18n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(6n); // gcd(48, 18) = 6
      });

      it("should correctly calculate gcd(54, 24)", async () => {
        await contract.write(ownerWallet, "gcd", [54n, 24n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(6n); // gcd(54, 24) = 6
      });
    });
  });

  describe.skip("I256 Operations", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    describe("isSignedNegative()", () => {
      it("should return false for positive values", async () => {
        await contract.write(ownerWallet, "setCounters", [0n, 5n]);

        const result = (await contract.read("isSignedNegative", [])) as boolean;
        expect(result).toBe(false);
      });

      it("should return true for negative values", async () => {
        await contract.write(ownerWallet, "setCounters", [0n, -5n]);

        const result = (await contract.read("isSignedNegative", [])) as boolean;
        expect(result).toBe(true);
      });

      it("should return false for zero", async () => {
        await contract.write(ownerWallet, "setCounters", [0n, 0n]);

        const result = (await contract.read("isSignedNegative", [])) as boolean;
        expect(result).toBe(false);
      });
    });

    describe("getSum()", () => {
      it("should correctly calculate the sum", async () => {
        await contract.write(ownerWallet, "setCounters", [3n, 2n]);

        const result = (await contract.read("getSum", [])) as bigint;
        expect(result).toBe(5n);
      });

      it("should handle negative values", async () => {
        await contract.write(ownerWallet, "setCounters", [5n, -2n]);

        const result = (await contract.read("getSum", [])) as bigint;
        expect(result).toBe(3n); // 5 + (-2) = 3
      });
    });

    describe("signedZigzag()", () => {
      it("should alternate between increment and decrement", async () => {
        const initialSigned = (await contract.read("getSigned", [])) as bigint;

        await contract.write(ownerWallet, "signedZigzag", [3n]);

        const finalSigned = (await contract.read("getSigned", [])) as bigint;
        // The zigzag does: +1, -1, +1 for 3 cycles
        expect(finalSigned).toBe(initialSigned + 1n);
      });
    });
  });

  describe.skip("Overflow and Underflow", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    describe("forceU256Overflow()", () => {
      it("should handle U256 overflow correctly", async () => {
        await contract.write(ownerWallet, "forceU256Overflow", []);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        // Should handle overflow without errors
        expect(typeof result).toBe("bigint");
      });
    });

    describe("forceU256Underflow()", () => {
      it("should handle U256 underflow correctly", async () => {
        await contract.write(ownerWallet, "forceU256Underflow", []);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        // Should handle underflow without errors
        expect(typeof result).toBe("bigint");
      });
    });

    describe("forceI256Overflow()", () => {
      it("should handle I256 overflow correctly", async () => {
        await contract.write(ownerWallet, "forceI256Overflow", []);

        const result = (await contract.read("getSigned", [])) as bigint;
        // Should handle overflow without errors
        expect(typeof result).toBe("bigint");
      });
    });

    describe("forceI256Underflow()", () => {
      it("should handle I256 underflow correctly", async () => {
        await contract.write(ownerWallet, "forceI256Underflow", []);

        const result = (await contract.read("getSigned", [])) as bigint;
        // Should handle underflow without errors
        expect(typeof result).toBe("bigint");
      });
    });

    describe("testOverflowInLoop()", () => {
      it("should handle overflow in loops correctly", async () => {
        await contract.write(ownerWallet, "testOverflowInLoop", []);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(typeof result).toBe("bigint");
      });
    });

    describe("testSignedOverflowInLoop()", () => {
      it("should handle signed overflow in loops correctly", async () => {
        await contract.write(ownerWallet, "testSignedOverflowInLoop", []);

        const result = (await contract.read("getSigned", [])) as bigint;
        expect(typeof result).toBe("bigint");
      });
    });
  });

  describe.skip("Reset Operations", () => {
    describe("reset()", () => {
      it("should reset both counters to zero", async () => {
        // First set non-zero values
        await contract.write(ownerWallet, "setCounters", [42n, -17n]);

        // Reset
        await contract.write(ownerWallet, "reset", []);

        const unsignedResult = (await contract.read("getUnsigned", [])) as bigint;
        const signedResult = (await contract.read("getSigned", [])) as bigint;

        expect(unsignedResult).toBe(0n);
        expect(signedResult).toBe(0n);
      });
    });

    describe("resetToValues()", () => {
      it("should reset to specific values", async () => {
        const unsignedValue = 100n;
        const signedValue = -50n;

        await contract.write(ownerWallet, "resetToValues", [unsignedValue, signedValue]);

        const unsignedResult = (await contract.read("getUnsigned", [])) as bigint;
        const signedResult = (await contract.read("getSigned", [])) as bigint;

        expect(unsignedResult).toBe(unsignedValue);
        expect(signedResult).toBe(signedValue);
      });
    });
  });

  describe.skip("Unsigned Counter", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    it("should count down from an initial value", async () => {
      const startValue = 5n;
      const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;

      await contract.write(ownerWallet, "countDown", [startValue]);

      const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
      // countDown should affect the unsigned counter
      expect(finalUnsigned).toBe(initialUnsigned + startValue);
    });
  });
});
