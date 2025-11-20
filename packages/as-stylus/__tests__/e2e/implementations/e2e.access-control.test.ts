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
const adminWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ACCESS_CONTROL;
const ROLE_ADMIN = 1n;
const ROLE_OPERATOR = 2n;

/**
 * Deploys the Pausable contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      contractFileName: "accessControl.ts",
      walletClient: adminWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Access Control Contract — Access Control", () => {
  it("should start with the correct role state", async () => {
    const isAdmin = await contract.read("isAdmin", [adminWallet.account!.address]);
    expect(isAdmin).toBe(true);
  });
  it("should grant and revoke roles", async () => {
    const userBAddress = userBWallet.account!.address;
    const isAdmin = await contract.read("isAdmin", [userBAddress]);
    expect(isAdmin).toBe(false);

    await contract.write(adminWallet, "grantRole", [ROLE_ADMIN, userBAddress]);
    const isAdminAfterGrant = await contract.read("isAdmin", [userBAddress]);
    expect(isAdminAfterGrant).toBe(true);

    await contract.write(adminWallet, "revokeRole", [ROLE_ADMIN, userBAddress]);
    const isAdminAfterRevoke = await contract.read("isAdmin", [userBAddress]);
    expect(isAdminAfterRevoke).toBe(false);
  });

  it("should grant and revoke operator roles", async () => {
    const userBAddress = userBWallet.account!.address;
    const isOperator = await contract.read("isOperator", [userBAddress]);
    expect(isOperator).toBe(false);

    await contract.write(adminWallet, "grantRole", [ROLE_OPERATOR, userBAddress]);
    const isOperatorAfterGrant = await contract.read("isOperator", [userBAddress]);
    expect(isOperatorAfterGrant).toBe(true);
  });

  it("should revert when not admin", async () => {
    const userBAddress = userBWallet.account!.address;
    const error = await expectRevertWrite(contract, userBWallet, "grantRole", [
      ROLE_ADMIN,
      userBAddress,
    ]);
    expect(error.errorName).toBe("AccessControlMissingRole");
    expect(error.args).toEqual([ROLE_ADMIN, userBAddress]);
  });
});
