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
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_BOOLEAN;

// Test data
const TEST_KEY = true;
const OTHER_KEY = false;
const TEST_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const OTHER_ADDRESS = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const ENABLED = true;
const VALUE = 1000n;
const ID = 100n;
const TEST_NAME = "Test Name";

/**
 * Deploys the MappingBoolean contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "boolean.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingBoolean — Happy Path", () => {
  it("should set all values for true key and retrieve each field", async () => {
    // Set all values for true key
    await contract.write(ownerWallet, "set", [
      TEST_KEY,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      TEST_NAME,
    ]);

    // Get each field
    const id = (await contract.read("getIds", [TEST_KEY])) as bigint;
    const balance = (await contract.read("getBalance", [TEST_KEY])) as bigint;
    const enabled = (await contract.read("getEnabled", [TEST_KEY])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [TEST_KEY])) as string;
    const name = (await contract.read("getBooleanName", [TEST_KEY])) as string;

    // Verify all values
    expect(balance).toBe(VALUE);
    expect(id).toBe(ID);
    expect(otherAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(enabled).toBe(ENABLED);
    expect(name).toBe(TEST_NAME);
  });

  it("should set all values for false key and retrieve each field", async () => {
    // Set all values for false key
    await contract.write(ownerWallet, "set", [
      OTHER_KEY,
      VALUE * 2n,
      false,
      TEST_ADDRESS,
      //OTHER_ADDRESS,
      ID * 2n,
      TEST_NAME,
    ]);

    // Get each field
    const id = (await contract.read("getIds", [OTHER_KEY])) as bigint;
    const balance = (await contract.read("getBalance", [OTHER_KEY])) as bigint;
    const enabled = (await contract.read("getEnabled", [OTHER_KEY])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [OTHER_KEY])) as string;
    const name = (await contract.read("getBooleanName", [OTHER_KEY])) as string;
    // Verify all values
    expect(balance).toBe(VALUE * 2n);
    expect(id).toBe(ID * 2n);
    expect(otherAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(enabled).toBe(false);
    expect(name).toBe(TEST_NAME);
  });

  it("should maintain separate values for true and false keys", async () => {
    // Verify true key still has original values
    const trueId = (await contract.read("getIds", [TEST_KEY])) as bigint;
    const trueBalance = (await contract.read("getBalance", [TEST_KEY])) as bigint;
    const trueEnabled = (await contract.read("getEnabled", [TEST_KEY])) as boolean;
    const trueAddress = (await contract.read("getOtherAddress", [TEST_KEY])) as string;
    const trueName = (await contract.read("getBooleanName", [TEST_KEY])) as string;
    // Verify false key has different values
    const falseId = (await contract.read("getIds", [OTHER_KEY])) as bigint;
    const falseBalance = (await contract.read("getBalance", [OTHER_KEY])) as bigint;
    const falseEnabled = (await contract.read("getEnabled", [OTHER_KEY])) as boolean;
    const falseAddress = (await contract.read("getOtherAddress", [OTHER_KEY])) as string;
    const falseName = (await contract.read("getBooleanName", [OTHER_KEY])) as string;
    // Verify true key values
    expect(trueBalance).toBe(VALUE);
    expect(trueId).toBe(ID);
    expect(trueAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(trueEnabled).toBe(ENABLED);
    expect(trueName).toBe(TEST_NAME);
    // Verify false key values
    expect(falseBalance).toBe(VALUE * 2n);
    expect(falseId).toBe(ID * 2n);
    expect(falseAddress.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(falseEnabled).toBe(false);
    expect(falseName).toBe(TEST_NAME);
    // Verify they are different
    expect(trueBalance).not.toBe(falseBalance);
    expect(trueId).not.toBe(falseId);
    //expect(trueAddress).not.toBe(falseAddress);
    expect(trueEnabled).not.toBe(falseEnabled);
  });

  it("should set boolean name longer than 32 bytes and retrieve it", async () => {
    const longerName = "This is a test boolean name that is longer than 32 bytes";
    await contract.write(ownerWallet, "set", [
      TEST_KEY,
      VALUE,
      ENABLED,
      TEST_ADDRESS,
      ID,
      longerName,
    ]);
    const name = (await contract.read("getBooleanName", [TEST_KEY])) as string;
    expect(name).toBe(longerName);
  });
});
