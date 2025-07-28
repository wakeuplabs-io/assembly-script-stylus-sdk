// ---------------------------------------------------------------
//  End-to-end tests — ERC721 contract (Stylus)
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
import { expectRevert, handleDeploymentError } from "../helpers/utils.js";

config();

// Constants
const NAME_STR = "MyNFT";
const SYMBOL_STR = "MNFT";
const TOKEN_ID_1 = 1n;
const TOKEN_ID_2 = 2n;
const TOKEN_ID_3 = 3n;
const TOKEN_ID_4 = 4n;
const TOKEN_ID_APPROVAL = 5n;
const TOKEN_ID_TRANSFER = 6n;
const TOKEN_ID_INCORRECT_OWNER = 7n;
const TOKEN_ID_NOT_APPROVED = 8n;
const TOKEN_ID_BURN = 9n;
const TOKEN_ID_EDGE_CASE = 10n;
const NONEXISTENT_TOKEN = 999n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ERC721;
const getOwnerAddress = (): Address => ownerWallet.account?.address as Address;
const getUserBAddress = (): Address => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [NAME_STR, SYMBOL_STR],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("ERC721 — NFT Operations", () => {
  describe("Initial state and metadata", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
    });

    it("should have correct name", async () => {
      const result = (await contract.read("name", [])) as string;
      expect(result).toBe(NAME_STR);
    });

    it("should have correct symbol", async () => {
      const result = (await contract.read("symbol", [])) as string;
      expect(result).toBe(SYMBOL_STR);
    });

    it("should have zero initial balance for any address", async () => {
      const ownerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const userBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(ownerBalance).toBe(0n);
      expect(userBBalance).toBe(0n);
    });
  });

  describe("Minting operations", () => {
    it("should mint token and update owner and balance", async () => {
      const previousBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_1]);
      const owner = (await contract.read("ownerOf", [TOKEN_ID_1])) as Address;
      const balance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      expect(owner.toLowerCase()).toBe(getOwnerAddress().toLowerCase());
      expect(balance).toBe(previousBalance + 1n);
    });

    it("should mint multiple tokens to same address", async () => {
      const previousBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_2]);
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_3]);

      const balance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const owner2 = (await contract.read("ownerOf", [TOKEN_ID_2])) as Address;
      const owner3 = (await contract.read("ownerOf", [TOKEN_ID_3])) as Address;

      expect(balance).toBe(previousBalance + 2n);
      expect(owner2.toLowerCase()).toBe(getOwnerAddress().toLowerCase());
      expect(owner3.toLowerCase()).toBe(getOwnerAddress().toLowerCase());
    });

    it("should mint token to different address", async () => {
      const previousBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;
      await contract.write(ownerWallet, "mint", [getUserBAddress(), TOKEN_ID_4]);

      const owner = (await contract.read("ownerOf", [TOKEN_ID_4])) as Address;
      const userBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(owner.toLowerCase()).toBe(getUserBAddress().toLowerCase());
      expect(userBBalance).toBe(previousBalance + 1n);
    });

    it("should fail when querying nonexistent token owner", async () => {
      try {
        await contract.read("ownerOf", [NONEXISTENT_TOKEN]);
        fail("Expected revert for nonexistent token");
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Approval operations", () => {
    beforeAll(async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_APPROVAL]);
    });

    it("getApproved should revert for nonexistent token", async () => {
      const tokenId = NONEXISTENT_TOKEN;
      const result = await contract.readRaw("getApproved", [tokenId]);
      expect(result.success).toBe(false);
      expect(result.error?.name).toBe("ERC721NonexistentToken");
      expect(result.error?.args?.[0]).toBe(tokenId);
    });

    it("should have no approval for existing token", async () => {
      await contract.read("ownerOf", [TOKEN_ID_APPROVAL]);
      const approved = (await contract.read("getApproved", [TOKEN_ID_APPROVAL])) as Address;
      expect(approved).toBe(ZERO_ADDRESS);
    });

    it("should approve token and get approved address", async () => {
      await contract.write(ownerWallet, "approve", [getUserBAddress(), TOKEN_ID_APPROVAL]);
      const approved = (await contract.read("getApproved", [TOKEN_ID_APPROVAL])) as Address;
      expect(approved.toLowerCase()).toBe(getUserBAddress().toLowerCase());
    });

    it("should have no operator approval initially", async () => {
      const isApproved = (await contract.read("isApprovedForAll", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as boolean;
      expect(isApproved).toBe(false);
    });

    it("should set approval for all and check status", async () => {
      await contract.write(ownerWallet, "setApprovalForAll", [getUserBAddress(), true]);

      const isApproved = (await contract.read("isApprovedForAll", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as boolean;
      expect(isApproved).toBe(true);
    });

    it("should revoke approval for all", async () => {
      await contract.write(ownerWallet, "setApprovalForAll", [getUserBAddress(), false]);

      const isApproved = (await contract.read("isApprovedForAll", [
        getOwnerAddress(),
        getUserBAddress(),
      ])) as boolean;
      expect(isApproved).toBe(false);
    });
  });

  describe("Transfer operations", () => {
    beforeAll(async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_TRANSFER]);
    });

    beforeEach(async () => {
      await contract.write(ownerWallet, "setApprovalForAll", [getUserBAddress(), false]);
      await contract.write(ownerWallet, "approve", [ZERO_ADDRESS, TOKEN_ID_TRANSFER]);
    });

    afterEach(async () => {
      const tokenOwnerBefore = (await contract.read("ownerOf", [TOKEN_ID_TRANSFER])) as Address;
      if (tokenOwnerBefore.toLowerCase() === getUserBAddress().toLowerCase()) {
        await contract.write(userBWallet, "transferFrom", [
          getUserBAddress(),
          getOwnerAddress(),
          TOKEN_ID_TRANSFER,
        ]);
      }
    });

    it("should transfer token as owner", async () => {
      const initialOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const initialUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      await contract.write(ownerWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        TOKEN_ID_TRANSFER,
      ]);

      const newOwner = (await contract.read("ownerOf", [TOKEN_ID_TRANSFER])) as Address;
      const newOwnerBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      const newUserBBalance = (await contract.read("balanceOf", [getUserBAddress()])) as bigint;

      expect(newOwner.toLowerCase()).toBe(getUserBAddress().toLowerCase());
      expect(newOwnerBalance).toBe(initialOwnerBalance - 1n);
      expect(newUserBBalance).toBe(initialUserBBalance + 1n);
    });

    it("should transfer token with approval", async () => {
      await contract.write(ownerWallet, "approve", [getUserBAddress(), TOKEN_ID_TRANSFER]);
      await contract.write(userBWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        TOKEN_ID_TRANSFER,
      ]);

      const newOwner = (await contract.read("ownerOf", [TOKEN_ID_TRANSFER])) as Address;
      expect(newOwner.toLowerCase()).toBe(getUserBAddress().toLowerCase());
      const approved = (await contract.read("getApproved", [TOKEN_ID_TRANSFER])) as Address;
      expect(approved).toBe(ZERO_ADDRESS);
    });

    it("should transfer token with operator approval", async () => {
      await contract.write(ownerWallet, "setApprovalForAll", [getUserBAddress(), true]);

      await contract.write(userBWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        TOKEN_ID_TRANSFER,
      ]);

      const newOwner = (await contract.read("ownerOf", [TOKEN_ID_TRANSFER])) as Address;
      expect(newOwner.toLowerCase()).toBe(getUserBAddress().toLowerCase());
    });

    it("should fail transfer from incorrect owner", async () => {
      await contract.write(ownerWallet, "mint", [getUserBAddress(), TOKEN_ID_INCORRECT_OWNER]);
      const initialOwner = (await contract.read("ownerOf", [TOKEN_ID_INCORRECT_OWNER])) as Address;

      const result = await contract.writeRaw(userBWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        TOKEN_ID_INCORRECT_OWNER,
      ]);
      expect(result.error?.name).toBe("ERC721IncorrectOwner");
      expect(initialOwner.toLowerCase()).toBe(getUserBAddress().toLowerCase());
    });

    it("should fail transfer without approval", async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_NOT_APPROVED]);
      const initialOwner = (await contract.read("ownerOf", [TOKEN_ID_NOT_APPROVED])) as Address;
      const result = await contract.writeRaw(userBWallet, "transferFrom", [
        getOwnerAddress(),
        getUserBAddress(),
        TOKEN_ID_NOT_APPROVED,
      ]);
      expect(result.error?.name).toBe("ERC721InsufficientApproval");
      expect(initialOwner.toLowerCase()).toBe(getOwnerAddress().toLowerCase());
    });
  });

  describe("Burning operations", () => {
    it("should burn token and update balance", async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_BURN]);
      const initialBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;

      await contract.write(ownerWallet, "burn", [TOKEN_ID_BURN]);

      const finalBalance = (await contract.read("balanceOf", [getOwnerAddress()])) as bigint;
      expect(finalBalance).toBe(initialBalance - 1n);

      const dec = await expectRevert(contract, "ownerOf", [TOKEN_ID_BURN]);
      expect(dec.errorName).toBe("ERC721NonexistentToken");
    });

    it("should fail burning nonexistent token", async () => {
      const result = await contract.writeRaw(ownerWallet, "burn", [NONEXISTENT_TOKEN]);
      expect(result.error?.name).toBe("ERC721NonexistentToken");
    });
  });

  describe("Edge cases and validations", () => {
    beforeAll(async () => {
      await contract.write(ownerWallet, "mint", [getOwnerAddress(), TOKEN_ID_EDGE_CASE]);
    });

    it("should fail transfer to zero address", async () => {
      const result = await contract.writeRaw(ownerWallet, "transferFrom", [
        getOwnerAddress(),
        ZERO_ADDRESS,
        TOKEN_ID_EDGE_CASE,
      ]);
      expect(result.error?.name).toBe("ERC721InvalidReceiver");
    });

    it("should fail balanceOf for zero address", async () => {
      const dec = await expectRevert(contract, "balanceOf", [ZERO_ADDRESS]);
      expect(dec.errorName).toBe("ERC721InvalidOwner");
    });

    it("should fail approve for nonexistent token", async () => {
      const result = await contract.writeRaw(ownerWallet, "approve", [
        getUserBAddress(),
        NONEXISTENT_TOKEN,
      ]);
      expect(result.error?.name).toBe("ERC721NonexistentToken");
    });

    it("should fail getApproved for nonexistent token", async () => {
      const dec = await expectRevert(contract, "getApproved", [NONEXISTENT_TOKEN]);
      expect(dec.errorName).toBe("ERC721NonexistentToken");
    });
  });
});
