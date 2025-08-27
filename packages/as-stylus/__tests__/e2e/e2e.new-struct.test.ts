import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.NEW_STRUCT;

/**
 * Deploys the Functions in Args Test Contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Struct Return Address", () => {
  it("should return address from struct", async () => {
    await contract.write(ownerWallet, "setAddress", [ownerWallet.account?.address as Address]);

    const userData = (await contract.read("getUser", [])) as {
      address: Address;
      owner: Address;
    };

    expect(userData.address).toBe(ownerWallet.account?.address);
    expect(userData.owner).toBe(ownerWallet.account?.address);
  });

  it("should return address from struct", async () => {
    await contract.write(ownerWallet, "setAddress", [ownerWallet.account?.address as Address]);

    const address = await contract.read("getAddress", []);

    expect(address).toBe(ownerWallet.account?.address);
  });
});
