import { config } from "dotenv";
import { Hex, WalletClient, getAddress } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_UINT256;

// Test data
const TOKEN_ID = 1n;
const OWNER_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const APPROVED_ADDRESS = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const TOKEN_PRICE = 1000n;
const TOKEN_METADATA = 10n;
const TOKEN_ACTIVE = true;

/**
 * Deploys the MappingUint256 contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "uint256.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingUint256 — Happy Path", () => {
  it("should set token data and retrieve each field", async () => {
    // Set token data
    await contract.write(ownerWallet, "setToken", [
      TOKEN_ID,
      OWNER_ADDRESS,
      TOKEN_PRICE,
      APPROVED_ADDRESS,
      TOKEN_METADATA,
      TOKEN_ACTIVE,
    ]);

    // Get each field
    const owner = (await contract.read("getTokenOwner", [TOKEN_ID])) as string;
    const price = (await contract.read("getTokenPrice", [TOKEN_ID])) as bigint;
    const approval = (await contract.read("getTokenApproval", [TOKEN_ID])) as string;
    const metadata = (await contract.read("getTokenMetadata", [TOKEN_ID])) as bigint;
    const active = (await contract.read("getTokenActive", [TOKEN_ID])) as boolean;

    // Verify all values
    expect(owner.toLowerCase()).toBe(OWNER_ADDRESS.toLowerCase());
    expect(price).toBe(TOKEN_PRICE);
    expect(approval.toLowerCase()).toBe(APPROVED_ADDRESS.toLowerCase());
    expect(metadata).toBe(TOKEN_METADATA);
    expect(active).toBe(TOKEN_ACTIVE);
  });
});
