import { PublicClient, WalletClient, Account, createWalletClient, http } from "viem";
import { CONTRACT_PATHS } from "../utils/constants.js";
import { DeploymentMetrics } from "../../../shared/types/performance.js";
import { privateKeyToAccount } from "viem/accounts";

async function testDeploymentPerformance(
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<DeploymentMetrics> {
  console.log("🚀 Starting Counter contract deployment performance test...");

  const startTime = Date.now();
  const deploymentTx = await walletClient.deployContract({
    abi: CONTRACT_PATHS.COUNTER.abi,
    bytecode: CONTRACT_PATHS.COUNTER.bytecode,
    chain: walletClient.chain,
    account: walletClient.account as Account,
    args: [],
  });

  const endTime = Date.now();
  const deploymentTime = endTime - startTime;

  console.log("Transaction hash:", deploymentTx);

  console.log("⏳ Waiting for transaction confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deploymentTx,
    confirmations: 1,
  });

  console.log("Transaction receipt:", receipt);

  const metrics: DeploymentMetrics = {
    deploymentTime,
    size: CONTRACT_PATHS.COUNTER.bytecodeSize.toString(),
    gasUsed: receipt.gasUsed.toString(),
    address: receipt.contractAddress as string,
    transactionHash: deploymentTx,
  };

  // Log the results
  console.log("📊 Deployment Performance Metrics:");
  console.log(`   Deployment Time: ${deploymentTime}ms`);
  console.log(`   Contract Address: ${receipt.contractAddress}`);
  console.log(`   Transaction Hash: ${deploymentTx}`);

  console.log("✅ Deployment performance test completed successfully!");

  return metrics;
}

export async function deploy(): Promise<DeploymentMetrics> {
  try {
    const { network } = await import("hardhat");
    const { viem } = (await network.connect("arbitrumSepolia")) as any;
    const publicClient = await viem.getPublicClient();
    const walletClient = await createWalletClient({
      account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
      transport: http(process.env.RPC_URL),
    });

    const result = await testDeploymentPerformance(publicClient, walletClient);

    return result;
  } catch (error) {
    throw new Error(`Direct performance test failed: ${error}`);
  }
}
