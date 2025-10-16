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
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_ADDRESS;

// Test addresses
const TEST_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const OTHER_ADDRESS = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const ENABLED = true;
/**
 * Deploys the MappingAddress contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "address.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingAddress — Happy Path", () => {
  it("should set all values and retrieve each field", async () => {
    // Set all values
    await contract.write(ownerWallet, "set", [TEST_ADDRESS, 1000n, true, OTHER_ADDRESS, 100n]);

    // Get each field
    const id = (await contract.read("getIds", [TEST_ADDRESS])) as bigint;
    const balance = (await contract.read("getBalance", [TEST_ADDRESS])) as bigint;
    const enabled = (await contract.read("getEnabled", [TEST_ADDRESS])) as boolean;
    const otherAddress = (await contract.read("getOtherAddress", [TEST_ADDRESS])) as string;

    // Verify all values
    expect(balance).toBe(1000n);
    expect(id).toBe(100n);
    expect(otherAddress.toLowerCase()).toBe(OTHER_ADDRESS.toLowerCase());
    expect(enabled).toBe(ENABLED);
  });
});
