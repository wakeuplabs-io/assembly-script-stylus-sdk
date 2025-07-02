// ---------------------------------------------------------------
//  End-to-end tests — AdminRegistry contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "./client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "./constants.js";
import { setupE2EContract } from "./setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Constants
const ADMIN = "0x1111111111111111111111111111111111111111";
const ADMIN_FAIL = "0x1111111111111111111111111111111111111112";

// Test state
let contract: ReturnType<typeof contractService>;
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ADMIN_REGISTRY;

/**
 * Deploys the AdminRegistry contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      deployArgs: [ADMIN as Address],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("AdminRegistry Contract Tests", () => {
  describe("Initial setup verification", () => {
    it("should return initial admin address after deployment", async () => {
      const result = await contract.read("getAdmin", []);
      expect((result as string).toLowerCase()).toBe(ADMIN.toLowerCase());
    });

    it("should return true for isAdmin with initial admin", async () => {
      const result = await contract.read("isAdmin", [ADMIN as Address]);
      expect(result).toBe(true);
    });

    it("should return false for isAdmin with non-admin address", async () => {
      const result = await contract.read("isAdmin", [ADMIN_FAIL as Address]);
      expect(result).toBe(false);
    });

    it("should return false for adminIsZero initially", async () => {
      const result = await contract.read("adminIsZero", []);
      expect(result).toBe(false);
    });
  });

  describe("Admin management operations", () => {
    it("should update admin address when setAdmin is called", async () => {
      const NEW_ADMIN = "0x2222222222222222222222222222222222222222";

      // Set new admin
      await contract.write(walletClient, "setAdmin", [NEW_ADMIN as Address]);

      // Verify admin was updated
      const result = await contract.read("getAdmin", []);
      expect((result as string).toLowerCase()).toBe(NEW_ADMIN.toLowerCase());
    });

    it("should reset admin to zero address when resetAdmin is called", async () => {
      // Reset admin to zero
      await contract.write(walletClient, "resetAdmin", []);

      // Verify admin is now zero
      const isZero = await contract.read("adminIsZero", []);
      expect(isZero).toBe(true);
    });
  });
});
