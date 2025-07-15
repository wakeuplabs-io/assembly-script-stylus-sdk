// ---------------------------------------------------------------
//  End-to-end tests — If Happy Path contract (Stylus)
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

const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.IF_HAPPY_PATH;

/**
 * Deploys the IfHappyPath contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      deployArgs: [],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe.skip("If Happy Path Contract Tests", () => {
  describe("Static view functions", () => {
    it("should return 5 for getLowerWithFlag()", async () => {
      const result = await contract.read("getLowerWithFlag", []);
      expect(result).toBe(5n);
    });

    it("should return 1 for getLowerWithComparison()", async () => {
      const result = await contract.read("getLowerWithComparison", []);
      expect(result).toBe(1n);
    });

    it("should return 10 for getLowerWithComparisonFunction()", async () => {
      const result = await contract.read("getLowerWithComparisonFunction", []);
      expect(result).toBe(10n);
    });

    it("should return 3 for getLowerWithNestedIf()", async () => {
      const result = await contract.read("getLowerWithNestedIf", []);
      expect(result).toBe(3n);
    });

    it("should return true for getValueWithBooleanOperators()", async () => {
      const result = await contract.read("getValueWithBooleanOperators", []);
      expect(result).toBe(true);
    });
  });

  describe("Boolean flag functions", () => {
    it("should return correct boolean values from flag functions", async () => {
      const trueResult = await contract.read("getTrueFlag", []);
      expect(trueResult).toBe(true);

      const falseResult = await contract.read("getFalseFlag", []);
      expect(falseResult).toBe(false);
    });

    it("should set and get flag values correctly", async () => {
      // Test setting flag to true
      await contract.write(walletClient, "setFlag", [true]);
      let flag = await contract.read("getFlag", []);
      expect(flag).toBe(true);

      // Test setting flag to false
      await contract.write(walletClient, "setFlag", [false]);
      flag = await contract.read("getFlag", []);
      expect(flag).toBe(false);
    });
  });
});
