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

const MAX_GAS_COST = BigInt("100000000000000000"); // 0.1 ETH max cost (includes Stylus activation)

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
    it("should execute testCall successfully (calls to owner)", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(getBalance(contract.address)).toBe(contractBalance);
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance);
      expect(getBalance(getOwnerAddress())).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
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

      await contract.write(ownerWallet, "testTransfer", [transferAmount], BigInt(transferAmount));

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(getBalance(contract.address)).toBe(contractBalance);
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance);
      expect(getBalance(getOwnerAddress())).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testCallToOwner successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(
        ownerWallet,
        "testCallToOwner",
        [transferAmount],
        BigInt(transferAmount),
      );

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

      await contract.write(
        ownerWallet,
        "testCallToOwner",
        [transferAmount],
        BigInt(transferAmount),
      );

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

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));
      await contract.write(ownerWallet, "testDelegateCall", []);
      await contract.write(ownerWallet, "testStaticCall", []);
      await contract.write(ownerWallet, "testTransfer", [transferAmount], BigInt(transferAmount));

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);

      // Both testCall and testTransfer send ETH to owner then transfer it back to owner
      // Net result: contract balance stays 0, owner pays gas for 4 transactions
      expect(finalContractBalance).toBe(initialContractBalance);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST * 4n);
    });

    it("should handle calls with balance checking capability", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      const newOwnerBalance = getBalance(getOwnerAddress());
      const newContractBalance = getBalance(contract.address);

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(newContractBalance).toBe(contractBalance);
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should verify transformations work consistently", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));
      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);

      // Both testCall operations send ETH to contract then transfer it to owner
      // Net result: contract balance stays 0, owner pays gas for 2 transactions
      expect(finalContractBalance).toBe(initialContractBalance);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST * 2n);
    });
  });
});
