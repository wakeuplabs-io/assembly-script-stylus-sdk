import { WalletClient } from "viem";

import { ContractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_ADDRESS_REGEX,
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

// Test state
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.INHERITANCE;
let contract: ContractService;
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY);

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      deployArgs: [10n],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Inheritance", () => {
  describe("Initial state and constructor inheritance", () => {
    it("should have initial sum value of zero after deployment", async () => {
      const sum = await contract.read("getSum", []);
      expect(sum).toBe(10n);
    });
  });

  describe("Method inheritance", () => {
    it("should inherit setValue method from parent", async () => {
      await contract.write(walletClient, "setValue", [10n, 20n]);
      const sum = await contract.read("getSum", []);
      expect(sum).toBe(30n);
    });

    it("should access child-specific methods", async () => {
      await contract.write(walletClient, "setValue", [5n, 15n]);
      const sum = await contract.read("getSum", []);
      expect(sum).toBe(20n);
    });
  });

  describe("Overriding methods", () => {
    it("should override setValue method in child", async () => {
      const result = await contract.read("overrideMethod", []);
      expect(result).toBe(5n);
    });
  });

  describe("Calling parent methods", () => {
    it("should override getSumByParams method in child", async () => {
      const result = await contract.read("getSumInMemory", [1n, 2n]);
      expect(result).toBe(3n);

      const result2 = await contract.read("getSumByParams", [1n, 2n]);
      expect(result2).toBe(3n);
    });
  });
});
