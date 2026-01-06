import { config } from "dotenv";
import { Hex, WalletClient, getAddress } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_STRING;

// Test data
const TEST_KEY = "user1";
const OTHER_KEY = "user2";
const TEST_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const OTHER_ADDRESS = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const ENABLED = true;
const VALUE = 1000n;
const ID = 100n;
const VALUE_STRING = "Hello World!";
const OTHER_STRING = "Other World with a longer than 32 bytes string!";

/**
 * Deploys the MappingString contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "string.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingString — Happy Path", () => {
  it("should set all values for first key and retrieve each field", async () => {
    // Set all values for first key
    await contract.write(ownerWallet, "set", [
      TEST_KEY,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      VALUE_STRING,
    ]);

    // Get each field
    const id = (await contract.read("getIds", [TEST_KEY])) as bigint;
    const balance = (await contract.read("getBalance", [TEST_KEY])) as bigint;
    const enabled = (await contract.read("getEnabled", [TEST_KEY])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [TEST_KEY])) as string;
    const otherString = (await contract.read("getOtherString", [TEST_KEY])) as string;

    // Verify all values
    expect(balance).toBe(VALUE);
    expect(id).toBe(ID);
    expect(otherAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(enabled).toBe(ENABLED);
    expect(otherString).toBe(VALUE_STRING);
  });

  it("should set all values for second key and retrieve each field", async () => {
    // Set all values for second key
    await contract.write(ownerWallet, "set", [
      OTHER_KEY,
      VALUE * 2n,
      false,
      OTHER_ADDRESS,
      ID * 2n,
      OTHER_STRING,
    ]);

    // Get each field
    const id = (await contract.read("getIds", [OTHER_KEY])) as bigint;
    const balance = (await contract.read("getBalance", [OTHER_KEY])) as bigint;
    const enabled = (await contract.read("getEnabled", [OTHER_KEY])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [OTHER_KEY])) as string;
    const otherString = (await contract.read("getOtherString", [OTHER_KEY])) as string;

    // Verify all values
    expect(balance).toBe(VALUE * 2n);
    expect(id).toBe(ID * 2n);
    expect(otherAddress.toLowerCase()).toBe(OTHER_ADDRESS.toLowerCase());
    expect(enabled).toBe(false);
    expect(otherString).toBe(OTHER_STRING);
  });

  it("should maintain separate values for different string keys", async () => {
    // Verify first key still has original values
    const firstId = (await contract.read("getIds", [TEST_KEY])) as bigint;
    const firstBalance = (await contract.read("getBalance", [TEST_KEY])) as bigint;
    const firstEnabled = (await contract.read("getEnabled", [TEST_KEY])) as boolean;
    const firstAddress = (await contract.read("getOtherAddress", [TEST_KEY])) as string;
    const firstString = (await contract.read("getOtherString", [TEST_KEY])) as string;
    // Verify second key has different values
    const secondId = (await contract.read("getIds", [OTHER_KEY])) as bigint;
    const secondBalance = (await contract.read("getBalance", [OTHER_KEY])) as bigint;
    const secondEnabled = (await contract.read("getEnabled", [OTHER_KEY])) as boolean;
    const secondAddress = (await contract.read("getOtherAddress", [OTHER_KEY])) as string;
    const secondString = (await contract.read("getOtherString", [OTHER_KEY])) as string;

    // Verify first key values
    expect(firstBalance).toBe(VALUE);
    expect(firstId).toBe(ID);
    expect(firstAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(firstEnabled).toBe(ENABLED);
    expect(firstString).toBe(VALUE_STRING);
    // Verify second key values
    expect(secondBalance).toBe(VALUE * 2n);
    expect(secondId).toBe(ID * 2n);
    expect(secondAddress.toLowerCase()).toBe(OTHER_ADDRESS.toLowerCase());
    expect(secondEnabled).toBe(false);
    expect(secondString).toBe(OTHER_STRING);
    // Verify they are different
    expect(firstBalance).not.toBe(secondBalance);
    expect(firstId).not.toBe(secondId);
    expect(firstAddress).not.toBe(secondAddress);
    expect(firstEnabled).not.toBe(secondEnabled);
    expect(firstString).not.toBe(secondString);
  });
  it("should set and get with a longer than 32 bytes string key", async () => {
    const longString = "a".repeat(33);
    await contract.write(ownerWallet, "set", [
      longString,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      VALUE_STRING,
    ]);
    const id = (await contract.read("getIds", [longString])) as bigint;
    const balance = (await contract.read("getBalance", [longString])) as bigint;
    const enabled = (await contract.read("getEnabled", [longString])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [longString])) as string;
    const otherString = (await contract.read("getOtherString", [longString])) as string;

    expect(id).toBe(ID);
    expect(balance).toBe(VALUE);
    expect(enabled).toBe(ENABLED);
    expect(otherAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(otherString).toBe(VALUE_STRING);
  });

  it("should set and get with a longer than 32 bytes string value", async () => {
    await contract.write(ownerWallet, "set", [
      TEST_KEY,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      OTHER_STRING,
    ]);
    const otherString = (await contract.read("getOtherString", [TEST_KEY])) as string;
    expect(otherString).toBe(OTHER_STRING);
  });

  it("should set and get with a longer than 32 bytes string key and value", async () => {
    const longString = "a".repeat(33);
    await contract.write(ownerWallet, "set", [
      longString,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      OTHER_STRING,
    ]);
    const otherString = (await contract.read("getOtherString", [longString])) as string;
    expect(otherString).toBe(OTHER_STRING);
  });
});
