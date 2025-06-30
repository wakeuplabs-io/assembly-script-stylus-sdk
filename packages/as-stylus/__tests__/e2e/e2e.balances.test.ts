// ---------------------------------------------------------------
//  End-to-end tests — Balances mapping contract (Stylus)
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
const USER_A = "0x1111111111111111111111111111111111111111";
const USER_B = "0x2222222222222222222222222222222222222222";

const BAL_A = 100n;
const BAL_B = 200n;
const BAL_0 = 0n;

// Test state
let contractAddr = "";
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.BALANCES;

/**
 * Deploys the Balances contract and initializes the test environment
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

describe("Token contract — Balances and Allowances", () => {
  describe("Balances mapping — basic operations", () => {
    it("should return 0 for initial getBalance(user)", async () => {
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(BAL_0);
    });

    it("should reflect setBalance(userA, 100)", async () => {
      await contract.write(walletClient, "setBalance", [USER_A, BAL_A]);
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(BAL_A);
    });

    it("should handle independent slots for setBalance(userB, 200)", async () => {
      await contract.write(walletClient, "setBalance", [USER_B, BAL_B]);

      const balanceA = await contract.read("getBalance", [USER_A]);
      const balanceB = await contract.read("getBalance", [USER_B]);

      expect(balanceA).toBe(BAL_A);
      expect(balanceB).toBe(BAL_B);
    });
  });

  describe("Allowance mapping — basic operations", () => {
    it("should return 0 for initial allowance", async () => {
      const result = await contract.read("allowanceOf", [USER_A, USER_B]);
      expect(result).toBe(BAL_0);
    });

    it("should reflect approve(userA, userB, 100)", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_B, BAL_A]);
      const result = await contract.read("allowanceOf", [USER_A, USER_B]);
      expect(result).toBe(BAL_A);
    });

    it("should handle separate allowance paths", async () => {
      await contract.write(walletClient, "approve", [USER_B, USER_A, BAL_B]);

      const allowanceAB = await contract.read("allowanceOf", [USER_A, USER_B]);
      const allowanceBA = await contract.read("allowanceOf", [USER_B, USER_A]);

      expect(allowanceAB).toBe(BAL_A);
      expect(allowanceBA).toBe(BAL_B);
    });

    it("should clear allowances when set to 0", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_B, BAL_0]);
      await contract.write(walletClient, "approve", [USER_B, USER_A, BAL_0]);

      const allowanceAB = await contract.read("allowanceOf", [USER_A, USER_B]);
      const allowanceBA = await contract.read("allowanceOf", [USER_B, USER_A]);

      expect(allowanceAB).toBe(BAL_0);
      expect(allowanceBA).toBe(BAL_0);
    });
  });

  describe("Edge cases & large values", () => {
    const MAX = (1n << 256n) - 1n;
    const MAX_MINUS_1 = MAX - 1n;
    const HALF = MAX >> 1n;
    const ONE = 1n;

    it("should handle MAX value for setBalance", async () => {
      await contract.write(walletClient, "setBalance", [USER_A, MAX]);
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(MAX);
    });

    it("should handle MAX-1 value for setBalance", async () => {
      await contract.write(walletClient, "setBalance", [USER_A, MAX_MINUS_1]);
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(MAX_MINUS_1);
    });

    it("should handle HALF value for setBalance", async () => {
      await contract.write(walletClient, "setBalance", [USER_A, HALF]);
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(HALF);
    });

    it("should handle 1 value for setBalance", async () => {
      await contract.write(walletClient, "setBalance", [USER_A, ONE]);
      const result = await contract.read("getBalance", [USER_A]);
      expect(result).toBe(ONE);
    });

    it("should handle self-approval with MAX value", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_A, MAX]);
      const result = await contract.read("allowanceOf", [USER_A, USER_A]);
      expect(result).toBe(MAX);
    });

    it("should handle MAX-1 value for approve", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_B, MAX_MINUS_1]);
      const result = await contract.read("allowanceOf", [USER_A, USER_B]);
      expect(result).toBe(MAX_MINUS_1);
    });

    it("should handle HALF value for approve", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_B, HALF]);
      const result = await contract.read("allowanceOf", [USER_A, USER_B]);
      expect(result).toBe(HALF);
    });

    it("should handle 1 value for approve", async () => {
      await contract.write(walletClient, "approve", [USER_A, USER_B, ONE]);
      const result = await contract.read("allowanceOf", [USER_A, USER_B]);
      expect(result).toBe(ONE);
    });
  });
});
