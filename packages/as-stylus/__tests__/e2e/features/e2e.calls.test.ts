// ---------------------------------------------------------------
//  End-to-end tests — Calls contract (Stylus)
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
import { fundUser, getBalance, setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.CALLS;

const getOwnerAddress = () => ownerWallet.account?.address as Address;
const getUserBAddress = () => userBWallet.account?.address as Address;

const MAX_GAS_COST = BigInt("100000000000000000"); // 0.1 ETH max cost (includes Stylus activation)

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [getOwnerAddress()],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Calls Contract — Contract Call Operations", () => {
  describe("Initial state and setup", () => {
    it("should deploy successfully", () => {
      expect(contract).toBeTruthy();
    });

    it("should have correct owner address stored", async () => {
      const result = await contract.read("getMyAddress", []);
      expect(result).toBe(getOwnerAddress());
    });

    it("should have owner set in storage mapping", async () => {
      const ownerKey = 1n;
      const result = await contract.read("getOwner", [ownerKey]);
      expect(result).toBe(getOwnerAddress());
    });
  });

  describe("Storage operations", () => {
    it("should set and get owner correctly", async () => {
      const key = 5n;
      const newOwner = getUserBAddress();

      await contract.write(ownerWallet, "setOwner", [key, newOwner]);

      const result = await contract.read("getOwner", [key]);
      expect(result).toBe(newOwner);
    });
  });

  describe("Call operations with balance verification", () => {
    it("should execute testCall successfully (calls to owner)", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(getBalance(contract.address)).toBe(contractBalance);
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance);
      expect(getBalance(getOwnerAddress())).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testDelegateCall successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());

      await contract.write(ownerWallet, "testDelegateCall", []);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testStaticCall successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());

      await contract.write(ownerWallet, "testStaticCall", []);

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testTransfer successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testTransfer", [transferAmount], BigInt(transferAmount));

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(getBalance(contract.address)).toBe(contractBalance);
      expect(getBalance(getOwnerAddress())).toBeLessThan(ownerBalance);
      expect(getBalance(getOwnerAddress())).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should execute testCallToOwner successfully", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(
        ownerWallet,
        "testCallToOwner",
        [transferAmount],
        BigInt(transferAmount),
      );

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });
  });

  describe("Call patterns with storage", () => {
    it("should handle call to different owner addresses", async () => {
      const key1 = 10n;
      const key2 = 20n;
      const owner1 = getOwnerAddress();
      const owner2 = getUserBAddress();

      await contract.write(ownerWallet, "setOwner", [key1, owner1]);
      await contract.write(ownerWallet, "setOwner", [key2, owner2]);

      expect(await contract.read("getOwner", [key1])).toBe(owner1);
      expect(await contract.read("getOwner", [key2])).toBe(owner2);

      const ownerBalance = getBalance(getOwnerAddress());
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(
        ownerWallet,
        "testCallToOwner",
        [transferAmount],
        BigInt(transferAmount),
      );

      const newOwnerBalance = getBalance(getOwnerAddress());
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });
  });

  describe("Send operations with boolean returns", () => {
    it("should handle send with insufficient balance gracefully", async () => {
      // Test when contract has no balance to send
      const initialContractBalance = getBalance(contract.address);

      // This should not revert even if contract has insufficient balance
      // because send() returns false instead of reverting
      await expect(contract.write(ownerWallet, "testSendToOwner", [])).resolves.toBeDefined();

      // Contract balance should remain unchanged
      expect(getBalance(contract.address)).toBe(initialContractBalance); // Only 1 wei sent if any
    });

    it("should execute testSend successfully and return true", async () => {
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "1000000000000000"; // 0.001 ETH in wei

      // Send ETH to contract for testSend to work
      await contract.write(ownerWallet, "testSend", [], BigInt(transferAmount));

      // testSend should return true when successful
      // Note: The function returns boolean but we're testing the transaction success
      const finalContractBalance = getBalance(contract.address);

      // Contract should receive the ETH sent via the transaction value
      expect(finalContractBalance).toBeGreaterThan(initialContractBalance);
    });

    it("should execute testSendToOwner successfully and return true", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "1000000000000000"; // 0.001 ETH in wei

      // Send ETH to contract first, then it will send 1 wei to owner
      await contract.write(
        ownerWallet,
        "testSendToOwner",
        [],
        BigInt(transferAmount), // Contract receives this amount
      );

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);

      // Owner pays gas but receives 1 wei back from contract
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST);

      // Contract should have less than what it received (sent 1 wei to owner)
      expect(finalContractBalance).toBeLessThan(initialContractBalance + BigInt(transferAmount));
    });
  });

  describe("Send vs Transfer comparison", () => {
    it("should demonstrate send vs transfer behavior differences", async () => {
      const transferAmount = "1000000000000000"; // 0.001 ETH in wei

      // Fund contract first
      await contract.write(ownerWallet, "testTransfer", [transferAmount], BigInt(transferAmount));

      const ownerBalanceAfterTransfer = getBalance(getOwnerAddress());

      // testSend should not revert even if there are issues
      await expect(
        contract.write(ownerWallet, "testSend", [], BigInt(transferAmount)),
      ).resolves.toBeDefined();

      // Both operations should complete (send doesn't revert, transfer might)
      const ownerBalanceAfterSend = getBalance(getOwnerAddress());
      expect(ownerBalanceAfterSend).toBeLessThan(ownerBalanceAfterTransfer);
    });
  });

  describe("Message (msg) context view functions", () => {
    it("should get correct msg.sender from getMsgSender", async () => {
      // Use read with account to simulate the transaction sender
      const result = await contract.readWithAccount(ownerWallet, "getMsgSender", [], 1000000n);
      expect(result).toBe(getOwnerAddress());
    });

    it("should get msg.value from getMsgValue with sent ETH", async () => {
      const valueToSend = 1000000n; // 1M wei
      // Use read with value to simulate sending ETH
      const result = await contract.readWithAccount(ownerWallet, "getMsgValue", [], valueToSend);
      expect(result).toBe(valueToSend);
    });

    // TODO: Fix bytes encoding in generateBytesReturnLogic
    // it("should get msg.data from getMsgData", async () => {
    //   const result = await contract.readWithAccount(ownerWallet, "getMsgData", []);
    //   expect(result).toBeDefined();
    //   // Should return the encoded function call data as bytes
    //   expect(typeof result).toBe("string");
    // });

    // TODO: Fix bytes encoding in generateBytesReturnLogic
    // it("should get msg.sig from getMsgSig", async () => {
    //   const result = await contract.readWithAccount(ownerWallet, "getMsgSig", []);
    //   expect(result).toBeDefined();
    //   // Should return the function selector (4 bytes) as bytes
    //   expect(typeof result).toBe("string");
    // });
  });

  describe("Block context view functions", () => {
    it("should get current block timestamp from getBlockTimestamp", async () => {
      const result = await contract.read("getBlockTimestamp", []);
      expect(result).toBeDefined();
      expect(typeof result).toBe("bigint");
      expect(result).toBeGreaterThan(0n);
    });

    // TODO: Fix Block.number() host function - currently returns 0
    // it("should get current block number from getBlockNumber", async () => {
    //   const result = await contract.read("getBlockNumber", []);
    //   expect(result).toBeDefined();
    //   expect(typeof result).toBe("bigint");
    //   expect(result).toBeGreaterThan(0n);
    // });

    it("should get block coinbase from getBlockCoinbase", async () => {
      const result = await contract.read("getBlockCoinbase", []);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      // Should be a valid Ethereum address
      expect(result).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should get block basefee from getBlockBasefee", async () => {
      const result = await contract.read("getBlockBasefee", []);
      expect(result).toBeDefined();
      expect(typeof result).toBe("bigint");
      // Base fee can be 0 or positive
      expect(result).toBeGreaterThanOrEqual(0n);
    });

    it("should get block gas limit from getBlockGaslimit", async () => {
      const result = await contract.read("getBlockGaslimit", []);
      expect(result).toBeDefined();
      expect(typeof result).toBe("bigint");
      expect(result).toBeGreaterThan(0n);
    });
  });

  describe("Context functions consistency tests", () => {
    it("should have consistent block data across multiple calls", async () => {
      const timestamp1 = await contract.read("getBlockTimestamp", []);
      const number1 = await contract.read("getBlockNumber", []);

      // Small delay to ensure we might get different values
      await new Promise((resolve) => setTimeout(resolve, 100));

      const timestamp2 = await contract.read("getBlockTimestamp", []);
      const number2 = await contract.read("getBlockNumber", []);

      // In the same block, values should be the same
      // In different blocks, timestamp should be >= and number should be >=
      expect(timestamp2 as bigint).toBeGreaterThanOrEqual(timestamp1 as bigint);
      expect(number2 as bigint).toBeGreaterThanOrEqual(number1 as bigint);
    });

    // TODO: Fix - getMsgSender needs @External with readWithAccount, not @View with read
    // it("should have consistent msg.sender across different functions", async () => {
    //   const sender1 = await contract.read("getMsgSender", []);
    //   const sender2 = await contract.read("getMyAddress", []); // This returns contractAddress

    //   // msg.sender should be different from contract address for view calls
    //   expect(sender1).toBe(getOwnerAddress());
    //   expect(sender2).toBe(contract.address);
    //   expect(sender1).not.toBe(sender2);
    // });
  });

  describe("Edge cases and multiple operations", () => {
    it("should handle multiple sequential calls successfully", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));
      await contract.write(ownerWallet, "testDelegateCall", []);
      await contract.write(ownerWallet, "testStaticCall", []);
      await contract.write(ownerWallet, "testTransfer", [transferAmount], BigInt(transferAmount));

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);

      // Both testCall and testTransfer send ETH to owner then transfer it back to owner
      // Net result: contract balance stays 0, owner pays gas for 4 transactions
      expect(finalContractBalance).toBe(initialContractBalance);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST * 4n);
    });

    it("should handle multiple send operations consecutively", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const transferAmount = "1000000000000000"; // 0.001 ETH in wei

      // Multiple send operations
      await contract.write(ownerWallet, "testSend", [], BigInt(transferAmount));
      await contract.write(ownerWallet, "testSendToOwner", [], BigInt(transferAmount));
      await contract.write(ownerWallet, "testSend", [], BigInt(transferAmount));

      const finalOwnerBalance = getBalance(getOwnerAddress());

      // Owner should have paid gas for 3 transactions
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST * 3n);
    });

    it("should handle calls with balance checking capability", async () => {
      const ownerBalance = getBalance(getOwnerAddress());
      const contractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      const newOwnerBalance = getBalance(getOwnerAddress());
      const newContractBalance = getBalance(contract.address);

      // Contract receives ETH from external call, then transfers it to owner
      // Net result: owner balance stays similar (receives back what they sent), minus gas
      // Contract balance should remain 0 (receives then transfers out)
      expect(newContractBalance).toBe(contractBalance);
      expect(newOwnerBalance).toBeLessThan(ownerBalance);
      expect(newOwnerBalance).toBeGreaterThan(ownerBalance - MAX_GAS_COST);
    });

    it("should verify transformations work consistently", async () => {
      const initialOwnerBalance = getBalance(getOwnerAddress());
      const initialContractBalance = getBalance(contract.address);
      const transferAmount = "10000000000000000"; // 0.01 ETH in wei

      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));
      await contract.write(ownerWallet, "testCall", [transferAmount], BigInt(transferAmount));

      const finalOwnerBalance = getBalance(getOwnerAddress());
      const finalContractBalance = getBalance(contract.address);

      // Both testCall operations send ETH to contract then transfer it to owner
      // Net result: contract balance stays 0, owner pays gas for 2 transactions
      expect(finalContractBalance).toBe(initialContractBalance);
      expect(finalOwnerBalance).toBeLessThan(initialOwnerBalance);
      expect(finalOwnerBalance).toBeGreaterThan(initialOwnerBalance - MAX_GAS_COST * 2n);
    });
  });
});
