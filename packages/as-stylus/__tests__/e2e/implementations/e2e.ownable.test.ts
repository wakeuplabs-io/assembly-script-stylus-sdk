// ---------------------------------------------------------------
//  End-to-end tests — Pausable contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import {
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { expectRevertWrite, handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.OWNABLE;

/**
 * Deploys the Pausable contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      contractFileName: "ownable.ts",
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Ownable Contract — Initial State", () => {
  it("should start with the correct owner", async () => {
    const owner = await contract.read("getOwner", []);
    expect(owner).toBe(walletClient.account?.address);
  });
});

describe("Ownable Contract — Transfer Ownership Functionality", () => {
  it("should transfer ownership successfully", async () => {
    const newOwner = getWalletClient(USER_B_PRIVATE_KEY as Hex).account?.address;
    const owner = await contract.read("getOwner", []);
    expect(owner).toBe(walletClient.account?.address);

    await contract.write(walletClient, "transferOwnership", [newOwner as Hex]);
    const newOwnerContract = await contract.read("getOwner", []);
    expect(newOwnerContract).toBe(newOwner);
  });

  it("should revert when not owner", async () => {
    const newOwner = getWalletClient(USER_B_PRIVATE_KEY as Hex).account?.address;
    const error = await expectRevertWrite(contract, walletClient, "transferOwnership", [
      newOwner as Hex,
    ]);
    console.log("error", error);
    expect(error.errorName).toBe("OwnableNotOwner");
    expect(error.args).toEqual([walletClient.account?.address, newOwner]);
  });
});
