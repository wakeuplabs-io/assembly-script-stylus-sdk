// ---------------------------------------------------------------
//  End-to-end tests — OnlyMemoryStruct contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

config();

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

// Test constants
const TEST_ADDRESS = "0x1234567890123456789012345678901234567890" as Address;
const TEST_U256 = 42n;
const TEST_U256_2 = 100n;
const TEST_STRING = "Hello World!";

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ONLY_MEMORY_STRUCT_TEST;

/**
 * Deploys the OnlyMemoryStruct contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      walletClient,
      contractFileName: "only-memory.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("OnlyMemoryStruct Contract Tests", () => {
  describe("Storage Operations", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
    });

    it("should get struct", async () => {
      const struct = await contract.read("getStruct", [
        TEST_ADDRESS,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
      ]);

      expect(struct).toBeTruthy();
    });

    it("should increase value", async () => {
      const value = await contract.read("getIncreasedValue", [
        TEST_ADDRESS,
        TEST_STRING,
        TEST_U256,
        true,
        TEST_U256_2,
        TEST_U256,
      ]);

      expect(value).toBe(TEST_U256 + TEST_U256);
    });
  });
});
