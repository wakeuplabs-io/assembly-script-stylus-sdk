import { network } from "hardhat";
import { Account, Address, PublicClient, WalletClient } from "viem";
import { writeContract } from "viem/actions";
import { CONTRACT_PATHS } from "../utils/constants.js";
import { WriteMetrics } from "../../../shared/types/performance.js";
import { getWalletClient } from "../utils/client.js";

async function testMintPerformance(
  contractAddress: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<WriteMetrics> {
  const abi = CONTRACT_PATHS.ERC20.abi;

  const startTime = Date.now();
  const incTx = await writeContract(walletClient, {
    address: contractAddress,
    abi: abi,
    chain: walletClient.chain,
    account: walletClient.account as Account,
    functionName: "mint",
    args: [walletClient.account?.address as Address, 1n],
  });
  const endTime = Date.now();

  const receipt = await publicClient.waitForTransactionReceipt({ hash: incTx });

  const executionTime = endTime - startTime;

  const functionCallGas = receipt.gasUsed;

  const metrics: WriteMetrics = {
    gasUsed: functionCallGas.toString(),
    executionTime,
    transactionHash: incTx,
  };

  return metrics;
}

export async function mint(contractAddress: Address): Promise<WriteMetrics> {
  const { viem } = (await network.connect("arbitrumSepolia")) as any;
  const publicClient = await viem.getPublicClient();
  const walletClient = getWalletClient();
  return testMintPerformance(contractAddress, publicClient, walletClient);
}
