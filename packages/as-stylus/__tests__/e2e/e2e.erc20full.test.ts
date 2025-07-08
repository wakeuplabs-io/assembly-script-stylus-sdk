// ---------------------------------------------------------------
//  End-to-end tests — ERC20Full contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "../helpers/constants.js";
import { fundUser, setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Constants
const NAME_STR = "MyToken";
const SYMBOL_STR = "MYT";
const DECIMALS_18 = 18n;
const INIT_SUPPLY = 1000n;
const AMOUNT_100 = 100n;
const MINT_50 = 50n;
const BURN_30 = 30n;
const ZERO = 0n;

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ERC20_FULL;

const getOwnerAddress = () => ownerWallet.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      deployArgs: [NAME_STR, SYMBOL_STR],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("ERC20Full — Token Operations", () => {
  describe("Initial state and metadata", () => {
    it("should have correct name", async () => {
      const result = (await contract.read("name", [])) as string;
      expect(result).toBe(NAME_STR);
    });

    it("should have correct symbol", async () => {
      const result = (await contract.read("symbol", [])) as string;
      expect(result).toBe(SYMBOL_STR);
    });

    it("should have 18 decimals", async () => {
      const result = (await contract.read("decimals", [])) as bigint;
      expect(result).toBe(DECIMALS_18);
    });

    it("should have zero initial total supply", async () => {
      const result = (await contract.read("totalSupply", [])) as bigint;
      expect(result).toBe(ZERO);
    });

    it("should have zero initial owner balance", async () => {
      const result = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      expect(result).toBe(ZERO);
    });
  });

  describe("Minting operations", () => {
    it("should mint tokens and update total supply and balance", async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), INIT_SUPPLY]);

      const totalSupply = (await contract.read("totalSupply", [])) as bigint;
      const ownerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      expect(totalSupply).toBe(INIT_SUPPLY);
      expect(ownerBalance).toBe(INIT_SUPPLY);
    });

    it("should mint additional tokens to different address", async () => {
      await contract.write(ownerWallet, "mint", [getUserBAddress(), MINT_50]);

      const totalSupply = (await contract.read("totalSupply", [])) as bigint;
      const userBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(totalSupply).toBe(INIT_SUPPLY + MINT_50);
      expect(userBBalance).toBe(MINT_50);
    });

    it("should handle minting zero tokens", async () => {
      const beforeSupply = (await contract.read("totalSupply", [])) as bigint;
      const beforeBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      await contract.write(ownerWallet, "mint", [getOwnerAddress(), ZERO]);

      const afterSupply = (await contract.read("totalSupply", [])) as bigint;
      const afterBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      expect(afterSupply).toBe(beforeSupply);
      expect(afterBalance).toBe(beforeBalance);
    });
  });

  describe("Transfer operations", () => {
    it("should transfer tokens and update balances", async () => {
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      await contract.write(ownerWallet, "transfer", [getUserBAddress(), AMOUNT_100]);

      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance - AMOUNT_100);
      expect(finalUserBBalance).toBe(initialUserBBalance + AMOUNT_100);
    });

    it("should fail when transferring more than balance", async () => {
      const tooMuch = 999999999999999n;
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      try {
        await contract.write(ownerWallet, "transfer", [getUserBAddress(), tooMuch]);
      } catch {
        // Transaction might revert, which is expected
      }

      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance);
      expect(finalUserBBalance).toBe(initialUserBBalance);
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

    it("should overwrite previous allowance", async () => {
      await contract.write(ownerWallet, "approve", [getUserBAddress(), 30n]);
      await contract.write(ownerWallet, "approve", [getUserBAddress(), 70n]);

      const result = (await contract.read("allowance", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as bigint;
      expect(result).toBe(70n);
    });
  });

  describe("TransferFrom operations", () => {
    it("should succeed with valid allowance and update balances", async () => {
      // Set allowance
      await contract.write(ownerWallet, "approve", [getUserBAddress(), AMOUNT_100]);

      // Get initial balances
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      // USER_B transfers tokens from owner to USER_B using allowance
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

    it("should fail without approval", async () => {
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      try {
        await contract.write(userBWallet, "transferFrom", [
          getOwnerAddress(),
          getUserBAddress(),
          500n,
        ]);
      } catch {
        // Transaction might revert, which is expected
      }

      const finalOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const finalUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(finalOwnerBalance).toBe(initialOwnerBalance);
      expect(finalUserBBalance).toBe(initialUserBBalance);
    });
  });

  describe("Burning operations", () => {
    it("should burn tokens and update total supply and balance", async () => {
      const initialSupply = (await contract.read("totalSupply", [])) as bigint;
      const initialBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      await contract.write(ownerWallet, "burn", [BURN_30]);

      const finalSupply = (await contract.read("totalSupply", [])) as bigint;
      const finalBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      expect(finalSupply).toBe(initialSupply - BURN_30);
      expect(finalBalance).toBe(initialBalance - BURN_30);
    });

    it("should fail when burning more than balance", async () => {
      const tooMuch = 999999999999999n;
      const initialSupply = (await contract.read("totalSupply", [])) as bigint;
      const initialBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      try {
        await contract.write(ownerWallet, "burn", [tooMuch]);
      } catch {
        // Transaction might revert, which is expected
      }

      const finalSupply = (await contract.read("totalSupply", [])) as bigint;
      const finalBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      expect(finalSupply).toBe(initialSupply);
      expect(finalBalance).toBe(initialBalance);
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

    it("should handle self-transfers", async () => {
      const initialBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      await contract.write(ownerWallet, "transfer", [getOwnerAddress(), AMOUNT_100]);

      const finalBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      expect(finalBalance).toBe(initialBalance);
    });

    it("should handle complex scenarios", async () => {
      // Reset allowances
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
