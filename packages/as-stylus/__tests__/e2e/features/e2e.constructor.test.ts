import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.INHERITANCE;

/**
 * Deploys the Inheritance contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [10n, 20n], // initialValue: 10, multiplier: 20
      contractFileName: "child.ts",
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Constructor", () => {
  it("should not allow execute twice the constructor", async () => {
    const result = await contract.write(walletClient, "child_constructor", [1n, 20n]);
    console.log({ result });

    const value = await contract.read("getValue", []);
    expect(value).toBe(10n); // Should remain the original value, not change
  });
  it("should return the initial value from constructor arguments", async () => {
    const result = await contract.read("getValue", []);
    console.log(result);
    expect(result).toBe(10n); // initialValue from constructor
  });

  it("should not allow to access parent constructor", async () => {
    await expect(contract.read("parent_constructor", [])).rejects.toThrow();
  });
});
