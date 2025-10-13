import { writeContract } from "viem/actions";
import { network } from "hardhat";
import { WriteMetrics } from "../../../shared/types/performance.js";
import { CONTRACT_PATHS } from "../utils/constants.js";
import { Account, Address, PublicClient, WalletClient } from "viem";
import { getWalletClient } from "../utils/client.js";

async function testIncrementPerformance(
  contractAddress: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<WriteMetrics> {
  const abi = CONTRACT_PATHS.COUNTER.abi;

  const startTime = Date.now();

  const incTx = await walletClient.writeContract({
    address: contractAddress,
    abi: abi,
    chain: walletClient.chain,
    account: walletClient.account as Account,
    functionName: "inc",
    args: [],
  });
  const endTime = Date.now();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: incTx });

  const executionTime = endTime - startTime;

  const functionCallGas = receipt.gasUsed;

  const metrics: WriteMetrics = {
    gasUsed: functionCallGas?.toString() ?? "0",
    executionTime,
    transactionHash: incTx,
  };

  return metrics;
}

export async function increment(contractAddress: Address): Promise<WriteMetrics> {
  const { viem } = (await network.connect("arbitrumSepolia")) as any;
  const publicClient = await viem.getPublicClient();
  const walletClient = getWalletClient();

  return testIncrementPerformance(contractAddress, publicClient, walletClient);
}
