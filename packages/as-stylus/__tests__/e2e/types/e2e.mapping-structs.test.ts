import { config } from "dotenv";
import { Address, Hex, WalletClient, getAddress } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_STRUCT;

interface UserInfo {
  to: Address;
  name: string;
  age: bigint;
  isActive: boolean;
}

// Test data
const TEST_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const TEST_STRING = "Hello World with a longer than 32 bytes string!";
const VALUE = 1000n;
const ENABLED = true;

/**
 * Deploys the MappingStruct contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "struct.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingStruct — Errors", () => {
  it("should deploy the contract", async () => {
    const contract = await setupE2EContract(contractPath, abiPath, {
      walletClient: ownerWallet,
      contractFileName: "struct.ts",
    });

    expect(contract).toBeDefined();
  });

  it("should set user data with address", async () => {
    await contract.write(ownerWallet, "setUserData", [TEST_STRING, VALUE, ENABLED, TEST_ADDRESS]);
    const userInfo = await contract.read("getUserInfo", [TEST_ADDRESS]);

    expect((userInfo as UserInfo).to.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect((userInfo as UserInfo).isActive).toBe(ENABLED);
    expect((userInfo as UserInfo).age).toBe(VALUE);
    expect((userInfo as UserInfo).name).toBe(TEST_STRING);
  });

  it("should increment age", async () => {
    await contract.write(ownerWallet, "incrementAge", [TEST_ADDRESS]);
    const userInfo = await contract.read("getUserInfo", [TEST_ADDRESS]);

    expect((userInfo as UserInfo).age).toBe(VALUE + 1n);
    expect((userInfo as UserInfo).to.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect((userInfo as UserInfo).isActive).toBe(ENABLED);
    expect((userInfo as UserInfo).name).toBe(TEST_STRING);
  });
});
