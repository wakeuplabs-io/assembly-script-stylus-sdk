// ---------------------------------------------------------------
//  End-to-end tests — Pausable contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { expectRevert, handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.PAUSABLE;

/**
 * Deploys the Pausable contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      contractFileName: "pausable.ts",
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Pausable Contract — Initial State", () => {
  it("should start in unpaused state", async () => {
    const isPaused = await contract.read("isPaused", []);
    expect(isPaused).toBe(false);
  });
});

describe("Pausable Contract — Pause Functionality", () => {
  it("should pause the contract successfully", async () => {
    // Verify initial state is not paused
    let isPaused = await contract.read("isPaused", []);
    expect(isPaused).toBe(false);

    // Pause the contract
    await contract.write(walletClient, "pause", []);

    // Verify contract is now paused
    isPaused = await contract.read("isPaused", []);
    expect(isPaused).toBe(true);
  });
});

describe("Pausable Contract — Unpause Functionality", () => {
  it("should unpause the contract successfully", async () => {
    // Verify contract is currently paused
    let isPaused = await contract.read("isPaused", []);
    expect(isPaused).toBe(true);

    // Unpause the contract
    await contract.write(walletClient, "unpause", []);

    // Verify contract is now unpaused
    isPaused = await contract.read("isPaused", []);
    expect(isPaused).toBe(false);
  });
});

describe("Pausable Contract — getValue Functionality", () => {
  it("should return 1 when not paused", async () => {
    const value = await contract.read("getValue", []);
    expect(value).toBe(1n);
  });

  it("should revert when paused", async () => {
    await contract.write(walletClient, "pause", []);
    const error = await expectRevert(contract, "getValue", []);
    console.log("error", error);
    expect(error.errorName).toBe("ContractPaused");
    expect(error.args).toEqual([]);
  });
});
