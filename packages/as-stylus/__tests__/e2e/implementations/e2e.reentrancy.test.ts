// ---------------------------------------------------------------
//  End-to-end tests — Pausable contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { expectRevertWrite, handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.REENTRANCY;

/**
 * Deploys the Pausable contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      contractFileName: "reentrancyGuard.ts",
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Reentrancy Contract — Non-Reentrant Functionality", () => {
  it("should start with the correct locked state", async () => {
    const locked = await contract.read("isLocked", []);
    expect(locked).toBe(false);
  });

  it("should revert when calling add function twice", async () => {
    await contract.write(walletClient, "add", []);

    await contract.write(walletClient, "enter", []);
    const error = await expectRevertWrite(contract, walletClient, "add", []);
    expect(error.errorName).toBe("ReentrancyGuardReentrant");
    expect(error.args).toEqual([]);

    await contract.write(walletClient, "exit", []);
    const locked = await contract.read("isLocked", []);
    expect(locked).toBe(false);
  });
});
