// ---------------------------------------------------------------
//  End-to-end tests — Voting contract (Stylus)
// ---------------------------------------------------------------
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
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const walletClient2: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.VOTING;

/**
 * Deploys the Pausable contract and initializes the test environment
 */
beforeAll(async () => {
  fundUser(walletClient2.account?.address as Address);

  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      contractFileName: "contract.ts",
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Voting Contract", () => {
  describe("deployment", () => {
    it("should deploy the contract", async () => {
      expect(contract.address).toBeDefined();
    });
  });

  describe("operations", () => {
    it("should create a proposal", async () => {
      const proposalCount = (await contract.read("getProposalCount", [])) as bigint;

      await contract.write(walletClient, "createProposal", []);
      const newProposalCount = await contract.read("getProposalCount", []);
      expect(newProposalCount).toBe(proposalCount + 1n);
    });

    it("should vote for a proposal", async () => {
      await contract.write(walletClient, "voteFor", [1n, "John Doe"]);
      const votesFor = (await contract.read("getVotesFor", [1n])) as bigint;
      const votesAgainst = (await contract.read("getVotesAgainst", [1n])) as bigint;
      expect(votesFor).toBe(1n);
      expect(votesAgainst).toBe(0n);

      const hasWon = await contract.read("hasWon", [1n]);
      expect(hasWon).toBe(true);

      const voterName = await contract.read("getVoterName", [
        walletClient.account?.address as Address,
      ]);
      expect(voterName).toBe("John Doe");
    });

    it("should vote against a proposal", async () => {
      await contract.write(walletClient2, "voteAgainst", [1n, "Jane Doe"]);
      const hasWon = await contract.read("hasWon", [1n]);
      expect(hasWon).toBe(false);

      const voterName = await contract.read("getVoterName", [
        walletClient2.account?.address as Address,
      ]);
      expect(voterName).toBe("Jane Doe");
    });
  });
});
