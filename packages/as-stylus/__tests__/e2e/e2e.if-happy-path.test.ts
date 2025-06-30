// ---------------------------------------------------------------
//  End-to-end tests — If Happy Path contract (Stylus)
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

// Test state
let contractAddr = "";
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.IF_HAPPY_PATH;
/**
 * Deploys the IfHappyPath contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    // Build and compile the contract
    run("npm run pre:build", PROJECT_ROOT);
    run("npx as-stylus build", contractPath);
    run("npm run compile", contractPath);
    run("npm run check", contractPath);
    const abi = getAbi(abiPath);

    // Deploy the contract
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
    await contract.write(walletClient, "deploy", []);
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

describe("If Happy Path Contract Tests", () => {
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
