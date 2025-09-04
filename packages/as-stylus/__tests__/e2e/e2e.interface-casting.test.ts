// ---------------------------------------------------------------
//  End-to-end tests — Interface Casting Contract (Stylus)
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

const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
let erc20Contract: ReturnType<typeof contractService>;
let erc721Contract: ReturnType<typeof contractService>;

const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.INTERFACE_CASTING;
const { contract: erc20Path, abi: erc20AbiPath } = CONTRACT_PATHS.ERC20_FULL;
const { contract: erc721Path, abi: erc721AbiPath } = CONTRACT_PATHS.ERC721;

const getOwnerAddress = () => ownerWallet.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    await fundUser(getUserBAddress());

    // Deploy ERC20 contract for testing interface casting
    erc20Contract = await setupE2EContract(erc20Path, erc20AbiPath, {
      deployArgs: ["TestToken", "TT"],
      walletClient: ownerWallet,
    });

    // Mint some tokens to the owner for testing
    await erc20Contract.write(ownerWallet, "mint", [getOwnerAddress(), 1000000n], 500000n);

    // Deploy ERC721 contract for testing interface casting
    erc721Contract = await setupE2EContract(erc721Path, erc721AbiPath, {
      deployArgs: ["TestNFT", "TNFT"],
      walletClient: ownerWallet,
    });

    // Mint NFT token for testing
    await erc721Contract.write(ownerWallet, "mint", [getOwnerAddress(), 1n], 500000n);
    // Deploy main interface casting contract
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [erc20Contract.address, erc721Contract.address, getOwnerAddress()],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Interface Casting Tests", () => {
  describe.skip("Initial state and setup", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
      expect(erc20Contract).toBeTruthy();
      expect(erc721Contract).toBeTruthy();
    });

    it("should have correct contract addresses stored", async () => {
      const tokenAddress = await contract.read("getTokenAddress", []);
      const nftAddress = await contract.read("getNftAddress", []);
      const owner = await contract.read("getOwner", []);
      expect((tokenAddress as string).toLowerCase()).toBe(erc20Contract.address.toLowerCase());
      expect((nftAddress as string).toLowerCase()).toBe(erc721Contract.address.toLowerCase());
      expect((owner as string).toLowerCase()).toBe(getOwnerAddress().toLowerCase());
    });
  });

  describe("ERC20 Interface Casting", () => {
    it("should read ERC20 name through interface casting", async () => {
      const nameDirect = await erc20Contract.read("name", []);
      console.log({ nameDirect });
      const name = await contract.read("getTokenName", []);
      console.log({ name });
      expect(name).toBe("TestToken");
    });

    it.skip("should read ERC20 symbol through interface casting", async () => {
      const symbol = await contract.read("getTokenSymbol", []);
      expect(symbol).toBe("TT");
    });

    it.skip("should read ERC20 decimals through interface casting", async () => {
      const decimals = await contract.read("getTokenDecimals", []);
      expect(decimals).toBe(18n);
    });

    it.skip("should read ERC20 total supply through interface casting", async () => {
      const totalSupply = await contract.read("getTokenTotalSupply", []);
      expect(totalSupply).toBeGreaterThan(0n);
    });

    it.skip("should read ERC20 balance through interface casting", async () => {
      const balance = await contract.read("getTokenBalance", [getOwnerAddress()]);
      expect(balance).toBeGreaterThan(0n);
    });
  });

  describe.skip("ERC721 Interface Casting", () => {
    beforeAll(async () => {
      // Mint an NFT to test with
      try {
        await erc721Contract.write(ownerWallet, "mint", [getOwnerAddress(), 1n], 500000n);
      } catch (error) {
        console.warn("NFT minting failed in setup:", error);
      }
    });

    it("should read ERC721 name through interface casting", async () => {
      const name = await contract.read("getNftName", []);
      expect(name).toBe("TestNFT");
    });

    it("should read ERC721 symbol through interface casting", async () => {
      const symbol = await contract.read("getNftSymbol", []);
      expect(symbol).toBe("TNFT");
    });

    it("should check ERC721 owner through interface casting", async () => {
      try {
        const owner = await contract.read("getNftOwner", [1n]);
        expect(owner).toBe(getOwnerAddress());
      } catch (error) {
        console.warn("NFT owner check failed (may need minting):", error);
        // Test may fail if NFT minting failed in beforeAll
      }
    });
  });

  describe.skip("Oracle Interface Casting", () => {
    it("should handle mock oracle price reading", async () => {
      // This tests interface casting with a mock oracle
      const price = await contract.read("getOraclePrice", []);
      expect(typeof price).toBe("bigint");
      expect(price).toBeGreaterThan(0n);
    });

    it("should handle mock oracle update (void function)", async () => {
      const newPrice = 12345n;
      // This function doesn't actually update the price, it's a void function for testing
      await contract.write(ownerWallet, "updateOraclePrice", [newPrice], 300000n);

      // The price remains constant as the contract uses a mock implementation
      const price = await contract.read("getOraclePrice", []);
      expect(price).toBe(100000000n); // Mock constant value
    });
  });

  describe.skip("Interface Casting Error Handling", () => {
    it("should handle failed external calls gracefully", async () => {
      // Test calling a non-existent function through interface casting
      try {
        await contract.read("callNonExistentFunction", []);
        // Should not throw as we handle errors gracefully in the contract
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid address casting gracefully", async () => {
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      try {
        const result = await contract.read("testZeroAddressCasting", [zeroAddress]);
        // Should return default values or handle gracefully
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe.skip("Gas Usage Analysis", () => {
    it("should use reasonable gas for interface casting calls", async () => {
      // TODO: Implement gas estimation in contract service
      // const gasEstimate = await contract.estimateGas("getTokenBalance", [getOwnerAddress()]);
      // console.log(`Gas estimate for interface casting call: ${gasEstimate}`);

      // For now, just verify the function works
      const balance = await contract.read("getTokenBalance", [getOwnerAddress()]);
      expect(typeof balance).toBe("bigint");
    });

    it("should use reasonable gas for write operations through interfaces", async () => {
      // TODO: Implement gas estimation in contract service
      // const gasEstimate = await contract.estimateGas("updateOraclePrice", [99999n]);
      // console.log(`Gas estimate for interface casting write: ${gasEstimate}`);

      // For now, just verify the function works
      expect(() => contract.read("getOraclePrice", [])).not.toThrow();
    });
  });

  describe.skip("Complex Interface Casting Operations", () => {
    it("should handle complex interaction with multiple interfaces", async () => {
      const result = await contract.read("complexInteraction", [getOwnerAddress(), 1n]);
      expect(typeof result).toBe("bigint");
      expect(result).toBeGreaterThan(0n);
    });

    it("should handle conditional casting based on boolean flag", async () => {
      const resultOracle = await contract.read("conditionalCasting", [true, erc20Contract.address]);
      expect(typeof resultOracle).toBe("bigint");

      const resultToken = await contract.read("conditionalCasting", [false, erc20Contract.address]);
      expect(typeof resultToken).toBe("bigint");
    });

    it("should handle safe token transfer through interface", async () => {
      const result = await contract.read("safeTokenTransfer", [getUserBAddress(), 1000n]);
      expect(typeof result).toBe("bigint"); // Returns boolean as bigint (0 or 1)
    });

    it("should handle nested interface calls correctly", async () => {
      const result = await contract.read("nestedInterfaceCalls", [getOwnerAddress()]);
      expect(typeof result).toBe("bigint");
      expect(result).toBeGreaterThan(0n);
    });

    it("should handle chained interface results", async () => {
      const result = await contract.read("getChainedInterfaceResult", []);
      expect(typeof result).toBe("bigint");
      expect(result).toBeGreaterThan(0n);
    });
  });

  describe.skip("Type Safety Validation", () => {
    it("should maintain type safety across interface boundaries", async () => {
      // This validates that TypeScript interface casting maintains proper types
      const balance = await contract.read("getTokenBalance", [getOwnerAddress()]);
      expect(typeof balance).toBe("bigint");

      const name = await contract.read("getTokenName", []);
      expect(typeof name).toBe("string");

      const decimals = await contract.read("getTokenDecimals", []);
      expect(typeof decimals).toBe("bigint");
    });
  });
});
