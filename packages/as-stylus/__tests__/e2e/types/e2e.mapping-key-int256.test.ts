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
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.MAPPING_INT256;

// Test data
const POSITION_ID = -100n; // Negative I256 to test signed integers
const TRADER_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const POSITION_SIZE = -500n; // Negative for short position
const COLLATERAL_AMOUNT = 10000n;
const POSITION_METADATA = 10n;
const POSITION_ACTIVE = true;
const POSITION_NAME = "Test Position";

/**
 * Deploys the MappingInt256 contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
      contractFileName: "int256.ts",
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("MappingInt256 — Happy Path", () => {
  it("should set position data and retrieve each field", async () => {
    // Set position data
    await contract.write(ownerWallet, "setPosition", [
      POSITION_ID,
      TRADER_ADDRESS,
      POSITION_SIZE,
      COLLATERAL_AMOUNT,
      POSITION_METADATA,
      POSITION_ACTIVE,
      POSITION_NAME,
    ]);

    // Get each field
    const trader = (await contract.read("getPositionTrader", [POSITION_ID])) as string;
    const size = (await contract.read("getPositionSize", [POSITION_ID])) as bigint;
    const collateral = (await contract.read("getPositionCollateral", [POSITION_ID])) as bigint;
    const metadata = (await contract.read("getPositionMetadata", [POSITION_ID])) as bigint;
    const active = (await contract.read("getPositionActive", [POSITION_ID])) as boolean;
    const name = (await contract.read("getPositionName", [POSITION_ID])) as string;

    // Verify all values
    expect(trader.toLowerCase()).toBe(TRADER_ADDRESS.toLowerCase());
    expect(size).toBe(POSITION_SIZE);
    expect(collateral).toBe(COLLATERAL_AMOUNT);
    expect(metadata).toBe(POSITION_METADATA);
    expect(active).toBe(POSITION_ACTIVE);
    expect(name).toBe(POSITION_NAME);
  });

  it("should set position name longer than 32 bytes and retrieve it", async () => {
    const longerName = "This is a test position name that is longer than 32 bytes";
    await contract.write(ownerWallet, "setPosition", [
      POSITION_ID,
      TRADER_ADDRESS,
      POSITION_SIZE,
      COLLATERAL_AMOUNT,
      POSITION_METADATA,
      POSITION_ACTIVE,
      longerName,
    ]);
    const name = (await contract.read("getPositionName", [POSITION_ID])) as string;
    expect(name).toBe(longerName);
  });
});
