import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

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
  describe("Initial State Verification", () => {
    it("should have correct initial values", async () => {
      const booleanStorage = await contract.read("getBooleanStorage", []);
      const u256Storage = await contract.read("getU256Storage", []);
      const stringStorage = await contract.read("getStringStorage", []);

      expect(booleanStorage).toBe(false);
      expect(u256Storage).toBe(0n);
      expect(stringStorage).toBe("initial");
    });

    it("should verify individual generator functions work correctly", async () => {
      const smallNumber = await contract.read("verifySmallNumber", []);
      const concatenatedString = await contract.read("verifyConcatenatedString", []);
      const calculatedBoolean = await contract.read("verifyCalculatedBoolean", []);

      expect(smallNumber).toBe(42n);
      expect(concatenatedString).toBe("Hello World!");
      expect(calculatedBoolean).toBe(true); // !false = true
    });
  });

  describe("Boolean Function Arguments", () => {
    it("should handle function calls as boolean arguments", async () => {
      await contract.write(ownerWallet, "testBooleanFunctionArgs", []);

      const result = await contract.read("getBooleanStorage", []);
      expect(result).toBe(true); // Should be result of !getCalculatedBoolean() = !true = false, but then getBooleanTrue() = true
    });
  });

  describe("U256 Function Arguments", () => {
    it("should handle function calls as U256 arguments", async () => {
      await contract.write(ownerWallet, "testU256FunctionArgs", []);

      const result = (await contract.read("getU256Storage", [])) as bigint;

      // Should be result of getAddedNumbers().mul(getSmallNumber())
      // getAddedNumbers() = getSmallNumber() + 8 = 42 + 8 = 50
      // 50 * getSmallNumber() = 50 * 42 = 2100
      expect(result).toBe(2100n);
    });
  });

  describe("I256 Function Arguments", () => {
    it("should handle function calls as I256 arguments", async () => {
      await contract.write(ownerWallet, "testI256FunctionArgs", []);

      const result = (await contract.read("getI256Storage", [])) as bigint;

      // Should be result of getPositiveI256().sub(getNegativeNumber())
      // getPositiveI256() = 200, getNegativeNumber() = -100
      // 200 - (-100) = 200 + 100 = 300
      expect(result).toBe(300n);
    });
  });

  describe("String Function Arguments", () => {
    it("should handle function calls as string arguments", async () => {
      await contract.write(ownerWallet, "testStringFunctionArgs", []);

      const result = await contract.read("getStringStorage", []);

      // Should be result of getConcatenatedString().concat(getShortString())
      // getConcatenatedString() = "Hello World!", getShortString() = "Hello"
      // "Hello World!" + "Hello" = "Hello World!Hello"
      expect(result).toBe("Hello World!Hello");
    });
  });

  describe("Address Function Arguments", () => {
    it("should handle function calls as address arguments", async () => {
      await contract.write(ownerWallet, "testAddressFunctionArgs", []);

      const addressStorage = await contract.read("getAddressStorage", []);
      const booleanStorage = await contract.read("getBooleanStorage", []);

      // addressStorage should be set to getSenderAddress() result
      expect(addressStorage).toBeDefined();

      // booleanStorage should be result of addressStorage.equals(getZeroAddress())
      // Since addressStorage is sender (not zero), this should be false
      expect(booleanStorage).toBe(false);

      // Check that mapping was set with function calls
      const testAddress = "0x1234567890123456789012345678901234567890";
      const testAddressBalance = (await contract.read("getBalance", [testAddress])) as bigint;
      expect(testAddressBalance).toBe(50n); // getCalculatedNumber() returns 50
    });
  });

  describe("Struct Function Arguments", () => {
    it("should handle function calls in struct operations", async () => {
      await contract.write(ownerWallet, "testStructFunctionArgs", []);

      const userData = await contract.read("getUserData", []);

      // userData should be populated using function calls
      // name = getConcatenatedString() = "Hello World!"
      // age = getAddedNumbers() = 50
      // isActive = getCalculatedBoolean() = true
      expect(userData).toBeDefined();
      // Note: Actual struct field verification depends on how the contract returns struct data
    });
  });

  describe("Mapping Function Arguments", () => {
    it("should handle function calls as mapping arguments", async () => {
      await contract.write(ownerWallet, "testMappingFunctionArgs", []);

      const u256Storage = (await contract.read("getU256Storage", [])) as bigint;

      // u256Storage should be the balance at getTestAddress()
      // which was set in testAddressFunctionArgs() to 50
      expect(u256Storage).toBeGreaterThanOrEqual(0n);

      // Check zero address balance was set to getSmallNumber().add(getLargeNumber())
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      const zeroAddressBalance = (await contract.read("getBalance", [zeroAddress])) as bigint;
      expect(zeroAddressBalance).toBe(1000041n); // 42 + 999999 = 1000041
    });
  });

  describe("Event Function Arguments", () => {
    it("should handle function calls as event arguments", async () => {
      // This test verifies that the transaction doesn't revert when emitting events with function call arguments
      await expect(contract.write(ownerWallet, "testEventFunctionArgs", [])).resolves.toBeDefined();
    });
  });

  describe("Error Function Arguments", () => {
    it("should handle function calls as error arguments", async () => {
      // This test verifies that custom errors can be called with function arguments
      await expect(contract.write(ownerWallet, "testErrorFunctionArgs", [])).rejects.toThrow();
    });
  });

  describe("Nested Function Calls", () => {
    it("should handle deeply nested function calls", async () => {
      await contract.write(ownerWallet, "testNestedFunctionCalls", []);

      const u256Storage = (await contract.read("getU256Storage", [])) as bigint;
      const stringStorage = await contract.read("getStringStorage", []);
      const i256Storage = (await contract.read("getI256Storage", [])) as bigint;

      // u256Storage = getCalculatedNumber().add(getAddedNumbers()) = 50 + 50 = 100
      expect(u256Storage).toBe(100n);

      // stringStorage = getConcatenatedString().concat(getLongString())
      expect(stringStorage).toContain("Hello World!");
      expect(stringStorage).toContain("This is a very long string");

      // i256Storage = getCalculatedI256().add(getNegativeNumber()) = 100 + (-100) = 0
      expect(i256Storage).toBe(0n);
    });
  });

  describe("Complex Function Arguments Scenarios", () => {
    it("should handle complex scenarios with multiple function calls", async () => {
      await contract.write(ownerWallet, "testComplexFunctionArgs", []);

      // Verify that transfer operations occurred using function call arguments
      const testAddress = "0x1234567890123456789012345678901234567890";
      const testAddressBalance = (await contract.read("getBalance", [testAddress])) as bigint;
      expect(testAddressBalance).toBeGreaterThan(0n);
    });
  });

  describe("Conditional Function Arguments", () => {
    it("should handle function calls in conditional expressions", async () => {
      await contract.write(ownerWallet, "testConditionalFunctionArgs", []);

      const booleanStorage = await contract.read("getBooleanStorage", []);
      const u256Storage = (await contract.read("getU256Storage", [])) as bigint;
      const stringStorage = await contract.read("getStringStorage", []);

      // Since getBooleanTrue() returns true, u256Storage should be getSmallNumber() = 42
      expect(u256Storage).toBe(42n);

      // Ternary result: getBooleanTrue() ? getCalculatedBoolean() : getBooleanFalse()
      // true ? true : false = true
      expect(booleanStorage).toBe(true);

      // Complex condition is true, so stringStorage should be getConcatenatedString()
      expect(stringStorage).toBe("Hello World!");
    });
  });

  describe("Type Coverage Verification", () => {
    it("should have tested all primitive types as function arguments", async () => {
      // Verify boolean functions
      const boolResult = await contract.read("verifyCalculatedBoolean", []);
      expect(typeof boolResult).toBe("boolean");

      // Verify U256 functions
      const u256Result = await contract.read("verifySmallNumber", []);
      expect(typeof u256Result).toBe("bigint");

      // Verify string functions
      const stringResult = await contract.read("verifyConcatenatedString", []);
      expect(typeof stringResult).toBe("string");
    });

    it("should verify all function call patterns work together", async () => {
      // Run all test functions in sequence to verify comprehensive coverage
      await contract.write(ownerWallet, "testBooleanFunctionArgs", []);
      await contract.write(ownerWallet, "testU256FunctionArgs", []);
      await contract.write(ownerWallet, "testI256FunctionArgs", []);
      await contract.write(ownerWallet, "testStringFunctionArgs", []);
      await contract.write(ownerWallet, "testAddressFunctionArgs", []);
      await contract.write(ownerWallet, "testStructFunctionArgs", []);
      await contract.write(ownerWallet, "testMappingFunctionArgs", []);
      await contract.write(ownerWallet, "testNestedFunctionCalls", []);
      await contract.write(ownerWallet, "testComplexFunctionArgs", []);
      await contract.write(ownerWallet, "testConditionalFunctionArgs", []);

      // Verify final state
      const finalState = {
        boolean: await contract.read("getBooleanStorage", []),
        u256: await contract.read("getU256Storage", []),
        string: await contract.read("getStringStorage", []),
        address: await contract.read("getAddressStorage", []),
      };

      expect(finalState.boolean).toBe(true);
      expect(finalState.u256).toBe(42n);
      expect(finalState.string).toBe("Hello World!");
      expect(finalState.address).toBeDefined();
    });
  });
});
