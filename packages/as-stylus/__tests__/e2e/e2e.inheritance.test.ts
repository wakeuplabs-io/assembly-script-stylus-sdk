import { WalletClient } from "viem";

import { ContractService, getWalletClient } from "./client.js";
import {
  CONTRACT_ADDRESS_REGEX,
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "./constants.js";
import { setupE2EContract } from "./setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.INHERITANCE;
let contract: ContractService;
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY);

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      deployArgs: [],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Inheritance", () => {
  it("should inherit from parent", async () => {
    const sum = await contract.read("getSum", []);
    expect(sum).toBe(30);
  });
});
