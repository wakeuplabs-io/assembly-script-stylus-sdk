import { IncrementMetrics } from "../../../shared/types/performance";
import { getWalletClient, publicClient } from "../config/clients";
import { CONTRACT_PATHS } from "../config/constants";
import { contractService } from "./contract-service";
import { getAbi } from "./utils";

export async function increment(address: `0x${string}`): Promise<IncrementMetrics> {
  const abiPath = CONTRACT_PATHS.COUNTER.abi;
  const abi = getAbi(abiPath);
  const contract = contractService(address, abi, false);
  const walletClient = getWalletClient();

  const startTime = Date.now();
  const incTx = await contract.write(walletClient, "inc", []);
  const endTime = Date.now();

  const receipt = await publicClient.waitForTransactionReceipt({ hash: incTx });

  const executionTime = endTime - startTime;

  return {
    gasUsed: receipt.gasUsed.toString(),
    executionTime,
    transactionHash: incTx,
  };
}
