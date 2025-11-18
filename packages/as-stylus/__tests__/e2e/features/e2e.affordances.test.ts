import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "@/tests/helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "@/tests/helpers/constants.js";
import { setupE2EContract } from "@/tests/helpers/setup.js";
import { handleDeploymentError } from "@/tests/helpers/utils.js";

config();

// Test state
const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.AFFORDANCE;
const isLocalChain = walletClient!.chain?.id === 412346;

const COINBASE_MINER = "0xa4b000000000000000000073657175656e636572";
const GAS_LIMIT = "0x4000000000000";

/**
 * Deploys the Counter contract and initializes the test environment
 */
beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Block affordances view functions", () => {
  it("Basefee: should return the basefee", async () => {
    const basefee = await contract.read("getBasefee", []);
    expect(basefee).toBe(0n);
  });

  // NOTE: On local chain, the block number is zero
  it("Number: should return the number", async () => {
    const number = await contract.read("getNumber", []);
    if (isLocalChain) {
      expect(number).toBe(0n);
    } else {
      expect(number).toBeGreaterThan(0n);
    }
  });

  it("Timestamp: should return the timestamp", async () => {
    const timestamp = (await contract.read("getTimestamp", [])) as bigint;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = timestamp > now ? timestamp - now : now - timestamp;
    expect(diff <= 10n).toBe(true);
  });

  it("Chain ID: should return the chain ID", async () => {
    const chainId = await contract.read("getChainId", []);
    expect(Number(chainId)).toBe(walletClient!.chain?.id ?? 0);
  });

  it("Coinbase: should return the coinbase", async () => {
    const coinbase = (await contract.read("getCoinbase", [])) as Address;
    console.log("coinbase", coinbase);
    expect(coinbase.toLowerCase()).toBe(COINBASE_MINER.toLowerCase());
  });

  it("Gaslimit: should return the gaslimit", async () => {
    const gaslimit = (await contract.read("getGaslimit", [])) as bigint;
    const gaslimitHex = `0x${gaslimit.toString(16)}`;
    expect(gaslimitHex).toBe(GAS_LIMIT);
  });
});

describe("Msg context view functions", () => {
  const ownerWallet = getWalletClient(PRIVATE_KEY as Hex);
  it("Sender: should return the sender", async () => {
    const sender = await contract.readWithAccount(ownerWallet, "getMsgSender", []);
    expect(sender).toBe(ownerWallet.account?.address);
  });

  it("Value: should return the value", async () => {
    const value = await contract.read("getMsgValue", [], undefined, 1000000n);
    console.log("value", value);
    expect(value).toBe(1000000n);
  });
});

describe("Contract context view functions", () => {
  it("Address: should return the address", async () => {
    const address = (await contract.read("getContractAddress", [])) as Address;
    expect(address.toLowerCase()).toBe(contract.address.toLowerCase());
  });
});
