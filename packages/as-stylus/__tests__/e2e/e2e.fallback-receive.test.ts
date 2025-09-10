// ---------------------------------------------------------------
//  End-to-end tests — Fallback and Receive contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config({ path: ".env.test", override: true });

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.FALLBACK_RECEIVE;

describe("Fallback and Receive Functions", () => {
  beforeAll(async () => {
    try {
      contract = await setupE2EContract(contractPath, abiPath, {
        deployArgs: [],
        walletClient,
      });
    } catch (error) {
      handleDeploymentError(error);
    }
  }, DEPLOY_TIMEOUT);

  describe("Contract Deployment", () => {
    test("should deploy successfully with fallback and receive functions", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should initialize storage variables correctly", async () => {
      const balance = (await contract.read("getBalance", [])) as bigint;
      expect(balance).toBe(0n);
      const fallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
      expect(fallbackCount).toBe(0n);
    });
  });

  describe("Normal Function Calls", () => {
    test("should handle normal function calls correctly", async () => {
      const amount = 50n;
      const result = await contract.read("normalFunction", [amount]);
      expect(result).toBe(100n);
    });
  });

  describe("Fallback and Receive Transaction Scenarios", () => {
    describe("Scenario 1: No data + With ether → Receive Function", () => {
      test("should trigger receiveEther() when transaction has no data and includes ether", async () => {
        // Get initial balance
        const initialBalance = (await contract.read("getBalance", [])) as bigint;

        // Send raw transaction with empty calldata and 1 ETH
        const emptyCalldata = contract.buildEmptyCalldata();
        const result = await contract.writeRawTransaction(
          walletClient,
          emptyCalldata,
          1000000000000000000n, // 1 ETH in wei
        );

        expect(result.success).toBe(true);

        // Check that balance increased by 1 ETH (hardcoded in receiveEther)
        const newBalance = (await contract.read("getBalance", [])) as bigint;
        expect(newBalance).toBe(initialBalance + 1000000000000000000n);
      });
    });

    describe("Scenario 2: No data + No ether → Fallback Function", () => {
      test("should trigger fallbackFunction() when transaction has no data and no ether", async () => {
        // Get initial fallback count
        const initialFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;

        // Send raw transaction with empty calldata and no ETH
        const emptyCalldata = contract.buildEmptyCalldata();
        const result = await contract.writeRawTransaction(walletClient, emptyCalldata, 0n);

        expect(result.success).toBe(true);

        // Check that fallback count increased by 1
        const newFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
        expect(newFallbackCount).toBe(initialFallbackCount + 1n);
      });
    });

    describe("Scenario 3: Invalid selector + With ether → Fallback Function", () => {
      test("should trigger fallbackFunction() when invalid selector provided with ether", async () => {
        // Get initial fallback count
        const initialFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;

        // Send raw transaction with invalid selector and ETH
        const invalidCalldata = contract.buildInvalidCalldata("nonExistentFunction");
        const result = await contract.writeRawTransaction(
          walletClient,
          invalidCalldata,
          500000000000000000n, // 0.5 ETH in wei
        );

        expect(result.success).toBe(true);

        // Check that fallback count increased by 1
        const newFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
        expect(newFallbackCount).toBe(initialFallbackCount + 1n);
      });
    });

    describe("Scenario 4: Invalid selector + No ether → Fallback Function", () => {
      test("should trigger fallbackFunction() when invalid selector provided without ether", async () => {
        // Get initial fallback count
        const initialFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;

        // Send raw transaction with invalid selector and no ETH
        const invalidCalldata = contract.buildInvalidCalldata("anotherInvalidFunction");
        const result = await contract.writeRawTransaction(walletClient, invalidCalldata, 0n);

        expect(result.success).toBe(true);

        // Check that fallback count increased by 1
        const newFallbackCount = (await contract.read("getFallbackCount", [])) as bigint;
        expect(newFallbackCount).toBe(initialFallbackCount + 1n);
      });
    });
  });
});
