// ---------------------------------------------------------------
//  End-to-end tests — ERC20 contract (Stylus)
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
import { getAbi, PRIVATE_KEY, USER_B_PRIVATE_KEY, run, stripAnsi, RPC_URL } from "./utils.js";

config();

// Constants
const INIT_SUPPLY = 1000n;
const AMOUNT_100 = 100n;
const ZERO = 0n;

// Test state
let contractAddr = "";
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ERC20;
const abi = getAbi(abiPath);
console.log("abi", abi, contractPath);

// Helper to get wallet addresses
const getOwnerAddress = () => ownerWallet.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

/**
 * Deploys the ERC20 contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    console.log("🚀 Starting contract deployment...");
    console.log("Contract path:", contractPath);

    // Fund USER_B for gas
    console.log("💰 Funding USER_B for gas...");
    run(
      `cast send ${getUserBAddress()} --value 0.1ether --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
    );

    // Build and compile the contract
    console.log("📦 Building contract...");
    run("npm run pre:build", PROJECT_ROOT);
    run("npx as-stylus build", contractPath);
    run("npm run compile", contractPath);
    run("npm run check", contractPath);
    run("npx prettier --write ./artifacts/contract.transformed.ts", contractPath);

    // Deploy the contract
    console.log("🚢 Deploying contract...");
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

    // Initialize the contract by calling deploy with initial supply
    console.log("🔧 Initializing contract...");
    await contract.write(ownerWallet, "deploy", [INIT_SUPPLY]);

    console.log("✅ Contract setup completed successfully");
    console.log("👤 Owner address:", getOwnerAddress());
    console.log("👤 USER_B address:", getUserBAddress());
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

describe("ERC20 — Standard Token Operations", () => {
  describe("Initial state", () => {
    it("should have correct total supply", async () => {
      const result = (await contract.read("totalSupply", [])) as bigint;
      expect(result).toBe(INIT_SUPPLY);
    });

    it("should have owner balance equal to initial supply", async () => {
      const result = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      expect(result).toBe(INIT_SUPPLY);
    });
  });

  describe("Transfer operations", () => {
    it("should transfer tokens and update balances", async () => {
      // Transfer 100 tokens from owner to USER_B
      await contract.write(ownerWallet, "transfer", [getUserBAddress(), AMOUNT_100]);

      // Check balances
      const ownerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const userBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(ownerBalance).toBe(900n); // 1000 - 100
      expect(userBBalance).toBe(AMOUNT_100);
    });
  });

  describe("Allowance operations", () => {
    it("should have zero initial allowance", async () => {
      const result = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(result).toBe(ZERO);
    });

    it("should set allowance with approve", async () => {
      await contract.write(ownerWallet, "approve", [getUserBAddress(), AMOUNT_100]);

      const result = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(result).toBe(AMOUNT_100);
    });
  });

  describe("TransferFrom operations", () => {
    it("should succeed with valid allowance and update balances", async () => {
      // Get initial balances
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      // USER_B transfers 100 tokens from owner to USER_B using allowance
      await contract.write(userBWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        AMOUNT_100,
      ]);

      // Check that allowance was consumed
      const newAllowance = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(newAllowance).toBe(ZERO);

      // Check balances were updated
      const newOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const newUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(newOwnerBalance).toBe(initialOwnerBalance - AMOUNT_100);
      expect(newUserBBalance).toBe(initialUserBBalance + AMOUNT_100);
    });

    it("should fail when allowance is insufficient", async () => {
      // Get initial balances
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      // Try to transfer without allowance (should fail silently in Stylus)
      try {
        await contract.write(userBWallet, "transferFrom", [
          getOwnerAddress(),
          getUserBAddress(),
          AMOUNT_100,
        ]);
      } catch {
        // Transaction might revert, which is expected
      }

      // Balances should remain unchanged
      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance);
      expect(finalUserBBalance).toBe(initialUserBBalance);
    });

    it("should fail when owner balance is insufficient", async () => {
      // First approve a large amount
      await contract.write(ownerWallet, "approve", [getUserBAddress(), INIT_SUPPLY]);

      // Get initial balances
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      // Try to transfer more than owner has (should fail silently in Stylus)
      try {
        await contract.write(userBWallet, "transferFrom", [
          getOwnerAddress(),
          getUserBAddress(),
          INIT_SUPPLY,
        ]);
      } catch {
        // Transaction might revert, which is expected
      }

      // Balances should remain unchanged
      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance);
      expect(finalUserBBalance).toBe(initialUserBBalance);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero transfers", async () => {
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      await contract.write(ownerWallet, "transfer", [getUserBAddress(), ZERO]);

      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance);
      expect(finalUserBBalance).toBe(initialUserBBalance);
    });

    it("should handle zero approvals", async () => {
      await contract.write(ownerWallet, "approve", [getUserBAddress(), ZERO]);

      const result = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(result).toBe(ZERO);
    });

    it("should handle self-transfers", async () => {
      const initialBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      await contract.write(ownerWallet, "transfer", [getOwnerAddress(), AMOUNT_100]);

      const finalBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      expect(finalBalance).toBe(initialBalance);
    });

    it("should allow overwriting previous approvals", async () => {
      // Set initial approval
      await contract.write(ownerWallet, "approve", [getUserBAddress(), 50n]);
      let result = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(result).toBe(50n);

      // Overwrite with new approval
      await contract.write(ownerWallet, "approve", [getUserBAddress(), 75n]);
      result = (await contract.read("allowance", [getOwnerAddress(), getUserBAddress()])) as bigint;
      expect(result).toBe(75n);
    });
  });

  describe("Multiple user interactions", () => {
    it("should handle complex transfer scenarios", async () => {
      // Reset approvals
      await contract.write(ownerWallet, "approve", [getUserBAddress(), 0n]);

      // Get current balances
      const ownerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const userBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      // Owner transfers to USER_B
      await contract.write(ownerWallet, "transfer", [getUserBAddress(), 50n]);

      // USER_B transfers back to owner
      await contract.write(userBWallet, "transfer", [getOwnerAddress(), 30n]);

      // Check final balances
      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(ownerBalance - 20n); // net -20
      expect(finalUserBBalance).toBe(userBBalance + 20n); // net +20
    });
  });
});
