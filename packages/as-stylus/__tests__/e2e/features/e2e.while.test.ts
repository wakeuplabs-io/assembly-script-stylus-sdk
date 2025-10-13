import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

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
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.WHILE;
const _getOwnerAddress = (): Address => ownerWallet.account?.address as Address;
const getUserBAddress = (): Address => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("While Test", () => {
  describe("Basic while loops with different data types", () => {
    it("should increment u256Counter exactly 5 times", async () => {
      const initial = (await contract.read("getU256Counter", [])) as bigint;
      await contract.write(ownerWallet, "testWhileWithU256", []);
      const final = (await contract.read("getU256Counter", [])) as bigint;
      expect(final).toBe(initial + 5n);
    });

    it("should increment i256Counter exactly 3 times", async () => {
      const initial = (await contract.read("getI256Counter", [])) as bigint;
      await contract.write(ownerWallet, "testWhileWithI256", []);
      const final = (await contract.read("getI256Counter", [])) as bigint;
      expect(final).toBe(initial + 3n);
    });

    it("should increment u256Counter exactly 4 times with boolean condition", async () => {
      const initial = (await contract.read("getU256Counter", [])) as bigint;
      await contract.write(ownerWallet, "testWhileWithBoolean", []);
      const final = (await contract.read("getU256Counter", [])) as bigint;
      expect(final).toBe(initial + 4n);
    });
  });
});
