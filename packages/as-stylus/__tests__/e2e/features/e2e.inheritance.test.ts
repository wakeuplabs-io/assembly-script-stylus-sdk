import { WalletClient } from "viem";

import { ContractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

// Test state
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.INHERITANCE;
let contract: ContractService;
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY);

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [100n, 5n], // initialValue: 100, multiplier: 5
      walletClient,
      contractFileName: "child.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Inheritance", () => {
  describe("Initial state and constructor inheritance", () => {
    it("should have initial value from parent constructor", async () => {
      const value = await contract.read("getValue", []);
      expect(value).toBe(100n);
    });

    it("should have multiplier from child constructor", async () => {
      const multiplier = await contract.read("getMultiplier", []);
      expect(multiplier).toBe(5n);
    });
  });

  describe("Method inheritance", () => {
    it("should inherit getValue method from parent", async () => {
      const value = await contract.read("getValue", []);
      expect(value).toBe(100n);
    });

    it("should inherit setValue method from parent", async () => {
      await contract.write(walletClient, "setValue", [200n]);
      const value = await contract.read("getValue", []);
      expect(value).toBe(200n);
    });

    it("should inherit addToValue method from parent", async () => {
      await contract.write(walletClient, "addToValue", [50n]);
      const value = await contract.read("getValue", []);
      expect(value).toBe(250n); // 200 + 50
    });
  });

  describe("Child-specific methods", () => {
    it("should access child-specific multiplyValue method", async () => {
      await contract.write(walletClient, "setValue", [250n]);
      const result = await contract.read("multiplyValue", []);
      expect(result).toBe(1250n); // 250 * 5
    });

    it("should access child-specific getChildMessage method", async () => {
      const result = await contract.read("getChildMessage", []);
      expect(result).toBe(30n);
    });
  });

  describe("Method overriding", () => {
    it("should override getParentMessage method in child", async () => {
      const result = await contract.read("getParentMessage", []);
      expect(result).toBe(20n); // Child returns 20, not parent's 10
    });
  });
});
