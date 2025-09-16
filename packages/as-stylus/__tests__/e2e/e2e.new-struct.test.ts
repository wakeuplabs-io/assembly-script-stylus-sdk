import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.NEW_STRUCT;

/**
 * Deploys the Functions in Args Test Contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Struct New Struct", () => {
  describe("Struct Return Address", () => {
    it("should return address from struct", async () => {
      await contract.write(ownerWallet, "setBuyerAddress", [
        ownerWallet.account?.address as Address,
      ]);
      await contract.write(ownerWallet, "setSellerAddress", [
        ownerWallet.account?.address as Address,
      ]);

      const buyerAddress = await contract.read("getBuyerAddress", []);
      expect(buyerAddress).toBe(ownerWallet.account?.address);
      const sellerAddress = await contract.read("getSellerAddress", []);
      expect(sellerAddress).toBe(ownerWallet.account?.address);
    });
  });

  describe("Struct Return Struct", () => {
    it("should return struct from struct", async () => {
      const buyerMock = {
        address: ownerWallet.account?.address as Address,
        owner: ownerWallet.account?.address as Address,
        name: "Jhon has a very long and long name",
        lastName: "Doe",
        age: 42n,
        isActive: true,
      };

      const sellerMock = {
        address: ownerWallet.account?.address as Address,
        owner: ownerWallet.account?.address as Address,
        name: "Jane",
        lastName: "Foo",
        age: 36n,
        isActive: true,
      };

      await contract.write(ownerWallet, "setBuyer", [
        ownerWallet.account?.address as Address,
        buyerMock.name,
        buyerMock.lastName,
        buyerMock.age,
        buyerMock.isActive,
      ]);

      const userData = (await contract.read("getBuyer", [])) as {
        age: bigint;
        isActive: boolean;
        address: Address;
        name: string;
        lastName: string;
        owner: Address;
      };

      expect(userData.address).toBe(ownerWallet.account?.address);
      expect(userData.owner).toBe(ownerWallet.account?.address);
      expect(userData.name).toBe(buyerMock.name);
      expect(userData.lastName).toBe(buyerMock.lastName);
      expect(userData.age).toBe(buyerMock.age);
      expect(userData.isActive).toBe(buyerMock.isActive);

      // same with seller
      await contract.write(ownerWallet, "setSeller", [
        ownerWallet.account?.address as Address,
        sellerMock.name,
        sellerMock.lastName,
        sellerMock.age,
        sellerMock.isActive,
      ]);

      const sellerData = (await contract.read("getSeller", [])) as {
        age: bigint;
        isActive: boolean;
        address: Address;
        name: string;
        lastName: string;
        owner: Address;
      };

      expect(sellerData.address).toBe(ownerWallet.account?.address);
      expect(sellerData.owner).toBe(ownerWallet.account?.address);
      expect(sellerData.name).toBe(sellerMock.name);
      expect(sellerData.lastName).toBe(sellerMock.lastName);
      expect(sellerData.age).toBe(sellerMock.age);
      expect(sellerData.isActive).toBe(sellerMock.isActive);
    });
  });
});
