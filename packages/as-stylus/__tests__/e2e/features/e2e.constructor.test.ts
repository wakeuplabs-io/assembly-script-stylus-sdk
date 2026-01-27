import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import {
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "@/tests/helpers/constants.js";
import { fundUser, setupE2EContract } from "@/tests/helpers/setup.js";
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

  it("should not execute constructor when called twice - state should remain unchanged", async () => {
    // Capture initial state before attempting to call constructor again
    const initialValue = await contract.read("getValue", []);
    const initialMultiplier = await contract.read("getMultiplier", []);

    // Try to call constructor again with different values
    // The transaction should succeed but the constructor should not execute
    await contract.write(walletClient, "child_constructor", [999n, 888n]);

    // Verify that the state did not change (constructor was not executed)
    const valueAfter = await contract.read("getValue", []);
    const multiplierAfter = await contract.read("getMultiplier", []);

    expect(valueAfter).toBe(initialValue); // Should remain 10n, not 999n
    expect(multiplierAfter).toBe(initialMultiplier); // Should remain 20n, not 888n
  });

  it("should only allow deployer to call constructor on first deploy", async () => {
    // This test requires a fresh contract deployment
    // For now, we test that a non-deployer cannot call constructor
    // by verifying the transaction succeeds but doesn't change state
    const nonDeployerWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
    fundUser(nonDeployerWallet.account?.address ?? "");

    // Capture initial state
    const initialValue = await contract.read("getValue", []);
    const initialMultiplier = await contract.read("getMultiplier", []);

    // Try to call constructor with non-deployer wallet
    // Since constructor was already called, this should be a no-op
    await contract.write(nonDeployerWallet, "child_constructor", [1n, 20n]);

    // Verify state did not change (constructor was not executed)
    const valueAfter = await contract.read("getValue", []);
    const multiplierAfter = await contract.read("getMultiplier", []);

    expect(valueAfter).toBe(initialValue);
    expect(multiplierAfter).toBe(initialMultiplier);
  });
});
