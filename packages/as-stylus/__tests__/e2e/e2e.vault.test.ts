// ---------------------------------------------------------------
//  End-to-end tests — ERC-4626 Vault contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "../helpers/constants.js";
import { fundUser, setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Constants
const MOCK_ASSET_ADDRESS = "0x1234567890123456789012345678901234567890";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const VAULT_NAME = "Test Vault";
const VAULT_SYMBOL = "TVAULT";
const ASSETS_100 = 100n;
const SHARES_100 = 100n;
const ZERO = 0n;
const MAX_UINT256 = 2n ** 256n - 1n;

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.VAULT;

// Helper to get wallet addresses
const getOwnerAddress = () => walletClient.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

/**
 * Deploys the ERC-4626 Vault contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [MOCK_ASSET_ADDRESS, VAULT_NAME, VAULT_SYMBOL],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("ERC-4626 Vault — Tokenized Vault Standard", () => {
  describe("ERC-20 Metadata", () => {
    test("should return correct name", async () => {
      const name = await contract.read("name", []);
      expect(name).toBe(VAULT_NAME);
    });

    test("should return correct symbol", async () => {
      const symbol = await contract.read("symbol", []);
      expect(symbol).toBe(VAULT_SYMBOL);
    });

    test("should return correct decimals", async () => {
      const decimals = await contract.read("decimals", []);
      expect(decimals).toBe(18n);
    });

    test("should return initial total supply of zero", async () => {
      const totalSupply = await contract.read("totalSupply", []);
      expect(totalSupply).toBe(ZERO);
    });

    test("should return zero balance for owner initially", async () => {
      const balance = await contract.read("balanceOf", [getOwnerAddress()]);
      expect(balance).toBe(ZERO);
    });
  });

  describe.skip("ERC-4626 Metadata", () => {
    test("should return correct asset address", async () => {
      const asset = await contract.read("asset", []);
      expect(asset).toBe(MOCK_ASSET_ADDRESS);
    });

    test("should return initial total assets of zero", async () => {
      const totalAssets = await contract.read("totalAssets", []);
      expect(totalAssets).toBe(ZERO);
    });
  });

  describe.skip("Conversion Functions", () => {
    test("convertToShares should return 1:1 ratio when vault is empty", async () => {
      const shares = await contract.read("convertToShares", [ASSETS_100]);
      expect(shares).toBe(ASSETS_100);
    });

    test("convertToAssets should return 1:1 ratio when vault is empty", async () => {
      const assets = await contract.read("convertToAssets", [SHARES_100]);
      expect(assets).toBe(SHARES_100);
    });
  });

  describe.skip("Max Functions", () => {
    test("maxDeposit should return max uint256", async () => {
      const maxDeposit = await contract.read("maxDeposit", [getOwnerAddress()]);
      expect(maxDeposit).toBe(MAX_UINT256);
    });

    test("maxMint should return max uint256", async () => {
      const maxMint = await contract.read("maxMint", [getOwnerAddress()]);
      expect(maxMint).toBe(MAX_UINT256);
    });

    test("maxWithdraw should return zero for empty balance", async () => {
      const maxWithdraw = await contract.read("maxWithdraw", [getOwnerAddress()]);
      expect(maxWithdraw).toBe(ZERO);
    });

    test("maxRedeem should return zero for empty balance", async () => {
      const maxRedeem = await contract.read("maxRedeem", [getOwnerAddress()]);
      expect(maxRedeem).toBe(ZERO);
    });
  });

  describe.skip("Preview Functions", () => {
    test("previewDeposit should match convertToShares", async () => {
      const previewShares = await contract.read("previewDeposit", [ASSETS_100]);
      const convertShares = await contract.read("convertToShares", [ASSETS_100]);
      expect(previewShares).toBe(convertShares);
    });

    test("previewRedeem should match convertToAssets", async () => {
      const previewAssets = await contract.read("previewRedeem", [SHARES_100]);
      const convertAssets = await contract.read("convertToAssets", [SHARES_100]);
      expect(previewAssets).toBe(convertAssets);
    });

    test("previewMint should return assets needed for shares", async () => {
      const previewAssets = await contract.read("previewMint", [SHARES_100]);
      expect(previewAssets).toBe(SHARES_100);
    });

    test("previewWithdraw should return shares needed for assets", async () => {
      const previewShares = await contract.read("previewWithdraw", [ASSETS_100]);
      expect(previewShares).toBe(ASSETS_100);
    });
  });

  describe.skip("Allowance Functions", () => {
    test("allowance should return zero for new addresses", async () => {
      const allowance = await contract.read("allowance", [getOwnerAddress(), getUserBAddress()]);
      expect(allowance).toBe(ZERO);
    });

    test("approve should set allowance", async () => {
      await contract.write(walletClient, "approve", [getUserBAddress(), ASSETS_100]);

      const allowance = await contract.read("allowance", [getOwnerAddress(), getUserBAddress()]);
      expect(allowance).toBe(ASSETS_100);
    });
  });

  describe.skip("Error Handling", () => {
    test("should revert on transfer to zero address", async () => {
      await expect(
        contract.write(walletClient, "transfer", [ZERO_ADDRESS, ASSETS_100]),
      ).rejects.toThrow();
    });

    test("should revert on deposit with zero receiver address", async () => {
      await expect(
        contract.write(walletClient, "deposit", [ASSETS_100, ZERO_ADDRESS]),
      ).rejects.toThrow();
    });

    test("should revert on mint with zero receiver address", async () => {
      await expect(
        contract.write(walletClient, "mint", [SHARES_100, ZERO_ADDRESS]),
      ).rejects.toThrow();
    });

    test("should revert on withdraw with zero receiver address", async () => {
      await expect(
        contract.write(walletClient, "withdraw", [ASSETS_100, ZERO_ADDRESS, getOwnerAddress()]),
      ).rejects.toThrow();
    });

    test("should revert on redeem with zero receiver address", async () => {
      await expect(
        contract.write(walletClient, "redeem", [SHARES_100, ZERO_ADDRESS, getOwnerAddress()]),
      ).rejects.toThrow();
    });
  });

  describe.skip("Edge Cases", () => {
    test("should handle zero amounts in preview functions", async () => {
      const previewDepositZero = await contract.read("previewDeposit", [ZERO]);
      expect(previewDepositZero).toBe(ZERO);

      const previewMintZero = await contract.read("previewMint", [ZERO]);
      expect(previewMintZero).toBe(ZERO);

      const previewWithdrawZero = await contract.read("previewWithdraw", [ZERO]);
      expect(previewWithdrawZero).toBe(ZERO);

      const previewRedeemZero = await contract.read("previewRedeem", [ZERO]);
      expect(previewRedeemZero).toBe(ZERO);
    });

    test("should handle large amounts in conversion functions", async () => {
      const largeAmount = 2n ** 200n;

      const convertToShares = await contract.read("convertToShares", [largeAmount]);
      expect(convertToShares).toBe(largeAmount);

      const convertToAssets = await contract.read("convertToAssets", [largeAmount]);
      expect(convertToAssets).toBe(largeAmount);
    });
  });
});
