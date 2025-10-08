import { WriteMetrics } from "../../../shared/types/performance";
import { getWalletClient, publicClient } from "../config/clients";
import { CONTRACT_PATHS } from "../config/constants";
import { getAbi } from "../utils/utils";

export async function increment(address: `0x${string}`): Promise<WriteMetrics> {
  const abiPath = CONTRACT_PATHS.COUNTER.abi;
  const abi = getAbi(abiPath);
  const walletClient = getWalletClient();

  const startTime = Date.now();
  const incTx = await walletClient.writeContract({
    address: address,
    abi: abi,
    chain: walletClient.chain,
    account: walletClient.account,
    functionName: "inc",
    args: [],
  });
  const endTime = Date.now();

  const receipt = await publicClient.waitForTransactionReceipt({ hash: incTx });

  const executionTime = endTime - startTime;

  return {
    gasUsed: receipt.gasUsed.toString(),
    executionTime,
    transactionHash: incTx,
  };
}
