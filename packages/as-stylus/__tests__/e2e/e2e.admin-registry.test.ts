// ---------------------------------------------------------------
//  End-to-end tests — AdminRegistry contract (Stylus)
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
const ADMIN = "0x1111111111111111111111111111111111111111";
const ADMIN_FAIL = "0x1111111111111111111111111111111111111112";

// Test state
let contractAddr = "";
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ADMIN_REGISTRY;

/**
 * Deploys the AdminRegistry contract and initializes the test environment
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

    // Initialize the contract with the admin address
    await contract.write(walletClient, "deploy", [ADMIN as Address]);
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

describe("AdminRegistry Contract Tests", () => {
  describe("Initial setup verification", () => {
    it("should return initial admin address after deployment", async () => {
      const result = await contract.read("getAdmin", []);
      expect((result as string).toLowerCase()).toBe(ADMIN.toLowerCase());
    });

    it("should return true for isAdmin with initial admin", async () => {
      const result = await contract.read("isAdmin", [ADMIN as Address]);
      expect(result).toBe(true);
    });

    it("should return false for isAdmin with non-admin address", async () => {
      const result = await contract.read("isAdmin", [ADMIN_FAIL as Address]);
      expect(result).toBe(false);
    });

    it("should return false for adminIsZero initially", async () => {
      const result = await contract.read("adminIsZero", []);
      expect(result).toBe(false);
    });
  });

  describe("Admin management operations", () => {
    it("should update admin address when setAdmin is called", async () => {
      const NEW_ADMIN = "0x2222222222222222222222222222222222222222";

      // Set new admin
      await contract.write(walletClient, "setAdmin", [NEW_ADMIN as Address]);

      // Verify admin was updated
      const result = await contract.read("getAdmin", []);
      expect((result as string).toLowerCase()).toBe(NEW_ADMIN.toLowerCase());
    });

    it("should reset admin to zero address when resetAdmin is called", async () => {
      // Reset admin to zero
      await contract.write(walletClient, "resetAdmin", []);

      // Verify admin is now zero
      const isZero = await contract.read("adminIsZero", []);
      expect(isZero).toBe(true);
    });
  });
});
