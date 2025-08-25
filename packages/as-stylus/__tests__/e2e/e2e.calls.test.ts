// ---------------------------------------------------------------
//  End-to-end tests — Calls contract (Stylus)
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
import { fundUser, getBalance, setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.CALLS;

const getOwnerAddress = () => ownerWallet.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

const MAX_GAS_COST = BigInt("1000000000000000"); // 0.001 ETH max gas cost
const MIN_GAS_COST = BigInt("10000000000000"); // 0.00001 ETH min gas cost

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [getOwnerAddress()],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Calls Contract — Contract Call Operations", () => {
  describe("Initial state and setup", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
    });

    it("should have correct owner address stored", async () => {
      const result = await contract.read("getMyAddress", []);
      expect(result).toBe(getOwnerAddress());
    });

    it("should have owner set in storage mapping", async () => {
      const ownerKey = 1n;
      const result = await contract.read("getOwner", [ownerKey]);
      expect(result).toBe(getOwnerAddress());
    });
  });

  describe("Storage operations", () => {
    it("should set and get owner correctly", async () => {
      const key = 5n;
      const newOwner = getUserBAddress();

      await contract.write(ownerWallet, "setOwner", [key, newOwner]);

      const result = await contract.read("getOwner", [key]);
      expect(result).toBe(newOwner);
    });
  });

  describe("Call operations with balance verification", () => {
    it("should execute testCall successfully (calls to contract itself)", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount]);

      expect(getBalance(contract.address)).toBe(contractBalance + BigInt(transferAmount));
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance - BigInt(transferAmount));
    });

    it("should execute testDelegateCall successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());

      await contract.write(ownerWallet, "testDelegateCall", []);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testStaticCall successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());

      await contract.write(ownerWallet, "testStaticCall", []);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testTransfer successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testTransfer", [transferAmount]);

      expect(getBalance(contract.address)).toBe(contractBalance + BigInt(transferAmount));
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance - BigInt(transferAmount));
    });

    it("should execute testCallToOwner successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCallToOwner", [transferAmount]);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });
  });

  describe("Call patterns with storage", () => {
    it("should handle call to different owner addresses", async () => {
      const key1 = 10n;
      const key2 = 20n;
      const owner1 = getOwnerAddress();
      const owner2 = getUserBAddress();

      await contract.write(ownerWallet, "setOwner", [key1, owner1]);
      await contract.write(ownerWallet, "setOwner", [key2, owner2]);

      expect(await contract.read("getOwner", [key1])).toBe(owner1);
      expect(await contract.read("getOwner", [key2])).toBe(owner2);

      const ownerBalance = getBalance(getOwnerAddress());
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCallToOwner", [transferAmount]);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });
  });

  describe("Edge cases and multiple operations", () => {
    it("should handle multiple sequential calls successfully", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount]);
      await contract.write(ownerWallet, "testDelegateCall", []);
      await contract.write(ownerWallet, "testStaticCall", []);
      await contract.write(ownerWallet, "testTransfer", [transferAmount]);

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);
      const totalTransferred = BigInt(transferAmount) * 2n;

      expect(finalContractBalance).toBe(initialContractBalance + totalTransferred);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance - totalTransferred);
      expect(finalOwnerBalance).toBeGreaterThan(
        initialOwnerBalance - totalTransferred - MAX_GAS_COST * 4n,
      );
    });

    it("should handle calls with balance checking capability", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount]);

      const newOwnerBalance = getBalance(getOwnerAddress());
      const newContractBalance = getBalance(contract.address);

      expect(newContractBalance).toBe(contractBalance + BigInt(transferAmount));
      expect(newOwnerBalance).toBeLessThan(ownerBalance - BigInt(transferAmount));
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - BigInt(transferAmount) - MAX_GAS_COST);
    });

    it("should verify transformations work consistently", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount]);
      await contract.write(ownerWallet, "testCall", [transferAmount]);

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);
      const totalTransferred = BigInt(transferAmount) * 2n;

      expect(finalContractBalance).toBe(initialContractBalance + totalTransferred);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance - totalTransferred);
      expect(finalOwnerBalance).toBeGreaterThan(
        initialOwnerBalance - totalTransferred - MAX_GAS_COST * 2n,
      );
    });
  });
});
