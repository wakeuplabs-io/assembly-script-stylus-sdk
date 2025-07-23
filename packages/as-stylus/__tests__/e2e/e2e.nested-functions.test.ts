// ---------------------------------------------------------------
//  End-to-end tests — Nested functions contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

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
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("functions", () => {
  describe("Call functions in return", () => {
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
      expect(result).toBe(walletClient.account?.address);
    });
  });

  describe("Call functions in arguments", () => {
    it("should be able to call nested functions", async () => {
      const result = await contract.read("incrementThreeTimes", [0n]);
      expect(result).toBe(3n);
    });
  });
});
