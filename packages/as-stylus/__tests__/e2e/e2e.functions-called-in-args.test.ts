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
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.FUNCTION_CALLED_IN_ARGS;

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

describe("Functions Called as Arguments — All Types", () => {
  describe("U256 Function Arguments", () => {
    it("should handle function calls as U256 arguments", async () => {
      await contract.write(ownerWallet, "testU256InArg", []);

      const result = (await contract.read("getU256Value", [])) as bigint;

      expect(result).toBe(142n);
    });
  });

  describe("I256 Function Arguments", () => {
    it("should handle function calls as I256 arguments", async () => {
      await contract.write(ownerWallet, "testI256InArg", []);

      const result = (await contract.read("getI256Value", [])) as bigint;

      expect(result).toBe(10n);
    });
  });

  describe("Boolean Function Arguments", () => {
    it("should handle function calls as boolean arguments in conditional statements", async () => {
      await contract.write(ownerWallet, "testBoolInIf", []);

      const result = await contract.read("getBoolValue", []);
      expect(result).toBe(true);
    });
  });

  describe("Address Function Arguments", () => {
    it("should handle function calls as address arguments in mappings", async () => {
      await contract.write(ownerWallet, "testAddrInMapping", []);
      await contract.write(ownerWallet, "setAddress", [ownerWallet.account?.address as Address]);

      const senderAddress = (await contract.read("getAddrValue", [])) as Address;
      const balance = (await contract.read("getBalance", [senderAddress])) as bigint;

      expect(balance).toBe(42n);
    });
  });

  describe("Struct Function Arguments", () => {
    it("should handle function calls in struct operations", async () => {
      await contract.write(ownerWallet, "setUser", [
        42n,
        1n,
        true,
        ownerWallet.account?.address as Address,
      ]);

      const userData = (await contract.read("getUserExternal", [])) as {
        age: bigint;
        index: bigint;
        isActive: boolean;
        address: Address;
      };

      expect(userData.age).toBe(42n);
      expect(userData.index).toBe(1n);
      expect(userData.isActive).toBe(true);
      expect(userData.address).toBe(ownerWallet.account?.address);
    });
  });

  describe("Nested Function Calls", () => {
    it("should handle function calls within function calls", async () => {
      await contract.write(ownerWallet, "testFuncInFuncCall", []);

      const result = (await contract.read("getU256Value", [])) as bigint;

      // Should be result of getU256().add(getU256().mul(U256Factory.fromString("2")))
      // getU256() = 42
      // getU256().mul(2) = 42 * 2 = 84
      // 42 + 84 = 126
      expect(result).toBe(126n);
    });
  });

  describe("All View Results", () => {
    it("should return all view results", async () => {
      await contract.write(ownerWallet, "setAddress", [ownerWallet.account?.address as Address]);
      const result = await contract.read("getAllViewResults", [
        ownerWallet.account?.address as Address,
      ]);
      console.log("result", result);
      // getStrValue() = "abc"
      // getU256Value() = 42
      // getI256Value() = 10
      // getBoolValue() = true
      // getAddrValue() = ownerWallet.account?.address
      expect(result).toBeDefined();
    });
  });

  describe("Function Calls as Parameters", () => {
    it("should handle function calls as parameters to other functions", async () => {
      await contract.write(ownerWallet, "testFunctionCallAsParameter", []);

      const strResult = await contract.read("getStrValue", []);
      const u256Result = (await contract.read("getU256Value", [])) as bigint;
      const addrResult = await contract.read("getAddrValue", []);

      expect(strResult).toBe("abc");
      expect(u256Result).toBe(42n);
      expect(addrResult).toBe(ownerWallet.account?.address);
    });
  });
});
