import { WriteMetrics } from "../../../shared/types/performance";
import { getWalletClient, publicClient } from "../config/clients";
import { CONTRACT_PATHS } from "../config/constants";
import { getAbi } from "../utils/utils";
import { Address } from "viem";

export async function mint(address: `0x${string}`): Promise<WriteMetrics> {
  const abiPath = CONTRACT_PATHS.ERC20.abi;
  const abi = getAbi(abiPath);
  const walletClient = getWalletClient();

  const startTime = Date.now();
  const mintTx = await walletClient.writeContract({
    address: address,
    abi: abi,
    chain: walletClient.chain,
    account: walletClient.account,
    functionName: "mint",
    args: [walletClient.account?.address as Address, 1n],
  });
  const endTime = Date.now();

  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });

  const executionTime = endTime - startTime;

  return {
    gasUsed: receipt.gasUsed.toString(),
    executionTime,
    transactionHash: mintTx,
  };
}
