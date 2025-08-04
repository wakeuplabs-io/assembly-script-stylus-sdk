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
        const stepSize = (await contract.read("getStepSize", [])) as bigint;
        const signedOne = 1n;
        await contract.write(ownerWallet, "tripleIncrement", []);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;

        expect(finalUnsigned).toBe(initialUnsigned + stepSize * 3n);
        expect(finalSigned).toBe(initialSigned + signedOne * 3n);
      });
    });

    describe("bulkIncrement()", () => {
      it("should increment according to the 'times' parameter", async () => {
        const times = 4n;
        const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const initialSigned = (await contract.read("getSigned", [])) as bigint;
        const stepSize = (await contract.read("getStepSize", [])) as bigint;
        const negativeStepSize = (await contract.read("getNegativeStepSize", [])) as bigint;

        await contract.write(ownerWallet, "bulkIncrement", [times]);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;
        expect(finalUnsigned).toBe(initialUnsigned + stepSize * times);
        const expectedSignedChange = 2n + (times - 2n) * negativeStepSize;
        expect(finalSigned).toBe(initialSigned + expectedSignedChange);
      });

      it("should respect maxIterations when times is greater", async () => {
        const times = 15n;
        const initialUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const initialSigned = (await contract.read("getSigned", [])) as bigint;
        const stepSize = (await contract.read("getStepSize", [])) as bigint;
        const negativeStepSize = (await contract.read("getNegativeStepSize", [])) as bigint;
        const maxIterations = (await contract.read("getMaxIterations", [])) as bigint;

        await contract.write(ownerWallet, "bulkIncrement", [times]);

        const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
        const finalSigned = (await contract.read("getSigned", [])) as bigint;

        expect(finalUnsigned).toBe(initialUnsigned + stepSize * maxIterations);

        const expectedSignedChange = 2n + (maxIterations - 2n) * negativeStepSize;
        expect(finalSigned).toBe(initialSigned + expectedSignedChange);
      });
    });
  });

  describe("Mathematical Algorithms", () => {
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

    describe("simpleMultiply()", () => {
      it("should correctly calculate 2 * 3 = 6", async () => {
        await contract.write(ownerWallet, "simpleMultiply", [2n, 3n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(6n);
      });

      it("should correctly calculate 4 * 5 = 20", async () => {
        await contract.write(ownerWallet, "simpleMultiply", [4n, 5n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(20n);
      });

      it("should correctly calculate 230 * 540 = 124200", async () => {
        await contract.write(ownerWallet, "simpleMultiply", [230n, 540n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(124200n);
      });
    });

    describe("factorial()", () => {
      it("should correctly calculate factorial(4)", async () => {
        await contract.write(ownerWallet, "factorial", [4n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(24n); // 4! = 24
      });

      it("should correctly calculate factorial(1)", async () => {
        await contract.write(ownerWallet, "factorial", [1n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(1n); // 1! = 1
      });

      it("should correctly calculate factorial(0)", async () => {
        await contract.write(ownerWallet, "factorial", [0n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(1n); // 0! = 1
      });

      it("should correctly calculate factorial(5)", async () => {
        await contract.write(ownerWallet, "factorial", [5n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(120n); // 5! = 120
      });
    });

    describe("pow()", () => {
      it("should correctly calculate 2^3", async () => {
        await contract.write(ownerWallet, "pow", [2n, 3n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(8n);
      });

      it("should correctly calculate 5^2", async () => {
        await contract.write(ownerWallet, "pow", [5n, 2n]);

        const result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(25n);
      });

      it("should handle powers of 0 and 1", async () => {
        await contract.write(ownerWallet, "pow", [5n, 0n]);
        let result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(1n);

        await contract.write(ownerWallet, "pow", [5n, 1n]);
        result = (await contract.read("getUnsigned", [])) as bigint;
        expect(result).toBe(5n);
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

  describe("I256 Operations", () => {
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
        expect(finalSigned).toBe(initialSigned + 3n);
      });
    });
  });

  describe("Overflow and Underflow", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    describe("forceU256Overflow()", () => {
      it("should handle U256 overflow correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "forceU256Overflow", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });

    describe("forceU256Underflow()", () => {
      it("should handle U256 underflow correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "forceU256Underflow", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });

    describe("forceI256Overflow()", () => {
      it("should handle I256 overflow correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "forceI256Overflow", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });

    describe("forceI256Underflow()", () => {
      it("should handle I256 underflow correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "forceI256Underflow", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });

    describe("testOverflowInLoop()", () => {
      it("should handle overflow in loops correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "testOverflowInLoop", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });

    describe("testSignedOverflowInLoop()", () => {
      it("should handle signed overflow in loops correctly", async () => {
        const result = await contract.writeRaw(ownerWallet, "testSignedOverflowInLoop", []);
        expect(result.error?.name).toBe("Panic");
        expect(result.error?.args).toEqual([17n]);
      });
    });
  });

  describe("Reset Operations", () => {
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

  describe("Unsigned Counter", () => {
    beforeEach(async () => {
      await contract.write(ownerWallet, "reset", []);
    });

    it("should count down from an initial value", async () => {
      const startValue = 5n;

      await contract.write(ownerWallet, "countDown", [startValue]);

      const finalUnsigned = (await contract.read("getUnsigned", [])) as bigint;
      expect(finalUnsigned).toBe(1n);
    });
  });
});
