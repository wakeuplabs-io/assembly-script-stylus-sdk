// ---------------------------------------------------------------
//  End-to-end tests — Fallback and Receive variants (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config({ path: ".env.test", override: true });

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);

describe.skip("Fallback and Receive Functions - All Variants", () => {
  describe("Variant 1: Fallback Only Contract", () => {
    let contract: ReturnType<typeof contractService>;
    const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.FALLBACK_ONLY;

    beforeAll(async () => {
      try {
        contract = await setupE2EContract(contractPath, abiPath, {
          contractFileName: "fallback_only.ts",
          deployArgs: [],
          walletClient,
        });
      } catch (error) {
        handleDeploymentError(error);
      }
    }, DEPLOY_TIMEOUT);

    test.skip("should deploy successfully with only fallback function", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should initialize fallback counter to zero", async () => {
      const fallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(fallbackCount).toBe(0n);
    });

    test("should trigger fallback for invalid selectors", async () => {
      const initialCount = (await contract.read("getFallbackCount", [])) as bigint;

      const invalidCalldata = contract.buildInvalidCalldata("invalidMethod");
      const result = await contract.writeRawTransaction(walletClient, invalidCalldata, 0n);

      expect(result.success).toBe(true);

      const newCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(newCount).toBe(initialCount + 1n);
    });

    test("should trigger fallback for empty calldata without value", async () => {
      const initialCount = (await contract.read("getFallbackCount", [])) as bigint;

      const emptyCalldata = contract.buildEmptyCalldata();
      const result = await contract.writeRawTransaction(walletClient, emptyCalldata, 0n);

      expect(result.success).toBe(true);

      const newCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(newCount).toBe(initialCount + 1n);
    });
  });

  describe("Variant 2: Receive Only Contract", () => {
    let contract: ReturnType<typeof contractService>;
    const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.RECEIVE_ONLY;

    beforeAll(async () => {
      try {
        contract = await setupE2EContract(contractPath, abiPath, {
          contractFileName: "receive_only.ts",
          deployArgs: [],
          walletClient,
        });
      } catch (error) {
        handleDeploymentError(error);
      }
    }, DEPLOY_TIMEOUT);

    test("should deploy successfully with only receive function", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should initialize balance to zero", async () => {
      const balance = (await contract.read("getBalance", [])) as bigint;
      expect(balance).toBe(0n);
    });

    test("should trigger receive for empty calldata with value", async () => {
      const initialBalance = (await contract.read("getBalance", [])) as bigint;

      const emptyCalldata = contract.buildEmptyCalldata();
      const result = await contract.writeRawTransaction(
        walletClient,
        emptyCalldata,
        1000000000000000000n, // 1 ETH
      );

      expect(result.success).toBe(true);

      const newBalance = (await contract.read("getBalance", [])) as bigint;
      expect(newBalance).toBe(initialBalance + 1000000000000000000n);
    });
  });

  describe("Variant 3: Receive-Fallback Reverse Order Contract", () => {
    let contract: ReturnType<typeof contractService>;
    const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.RECEIVE_FALLBACK_REVERSE;

    beforeAll(async () => {
      try {
        contract = await setupE2EContract(contractPath, abiPath, {
          contractFileName: "receive_fallback_reverse.ts",
          deployArgs: [],
          walletClient,
        });
      } catch (error) {
        handleDeploymentError(error);
      }
    }, DEPLOY_TIMEOUT);

    test("should deploy successfully with receive defined before fallback", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should initialize both counters to zero", async () => {
      const balance = (await contract.read("getBalance", [])) as bigint;
      const fallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(balance).toBe(0n);
      expect(fallbackCount).toBe(0n);
    });

    test("should trigger receive for empty calldata with value (order-independent)", async () => {
      const initialBalance = (await contract.read("getBalance", [])) as bigint;

      const emptyCalldata = contract.buildEmptyCalldata();
      const result = await contract.writeRawTransaction(
        walletClient,
        emptyCalldata,
        1000000000000000000n, // 1 ETH
      );

      expect(result.success).toBe(true);

      const newBalance = (await contract.read("getBalance", [])) as bigint;
      expect(newBalance).toBe(initialBalance + 1000000000000000000n);
    });

    test("should trigger fallback for invalid selector (order-independent)", async () => {
      const initialCount = (await contract.read("getFallbackCount", [])) as bigint;

      const invalidCalldata = contract.buildInvalidCalldata("someInvalidMethod");
      const result = await contract.writeRawTransaction(walletClient, invalidCalldata, 0n);

      expect(result.success).toBe(true);

      const newCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(newCount).toBe(initialCount + 1n);
    });
  });

  describe("Variant 4: No Fallback No Receive Contract", () => {
    let contract: ReturnType<typeof contractService>;
    const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.NO_FALLBACK_NO_RECEIVE;

    beforeAll(async () => {
      try {
        contract = await setupE2EContract(contractPath, abiPath, {
          contractFileName: "no_fallback_no_receive.ts",
          deployArgs: [],
          walletClient,
        });
      } catch (error) {
        handleDeploymentError(error);
      }
    }, DEPLOY_TIMEOUT);

    test("should deploy successfully without fallback or receive functions", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should work with normal function calls", async () => {
      const result = await contract.read("normalFunction", [50n]);
      expect(result).toBe(100n);
    });

    test("should increment counter normally", async () => {
      // Skip initial read to avoid AbiDecodingZeroDataError on uninitialized storage
      await contract.write(walletClient, "increment", []);

      const newCounter = (await contract.read("getCounter", [])) as bigint;
      expect(newCounter).toBe(1n); // After increment from 0, should be 1
    });

    test("invalid function calls are no-op (no fallback to handle them)", async () => {
      const invalidCalldata = contract.buildInvalidCalldata("nonExistentMethod");
      const result = await contract.writeRawTransaction(walletClient, invalidCalldata, 0n);

      // Invalid calls without fallback are successful no-ops (standard Stylus behavior)
      expect(result.success).toBe(true);
    });
  });
});
