import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "../helpers/constants.js";
import { fundUser, setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
let counterContract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.STATIC_CALLS;

const getUserBAddress = () => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    counterContract = await setupE2EContract(
      CONTRACT_PATHS.COUNTER.contract,
      CONTRACT_PATHS.COUNTER.abi,
      { walletClient: ownerWallet },
    );

    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [counterContract.address],
      walletClient: ownerWallet,
      verbose: true,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe.skip("Calls Contract — Contract Call Operations", () => {
  describe("Initial state and setup", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
      expect(counterContract).toBeTruthy();
    });

    it("should have correct owner address stored", async () => {
      await counterContract.write(ownerWallet, "increment", []);
      await counterContract.write(ownerWallet, "increment", []);

      const value = await counterContract.read("get", []);
      expect(value).toBe(2n);

      const result = await contract.read("testStaticCall", []);
      expect(result).toBe(2n);
    });
  });
});
