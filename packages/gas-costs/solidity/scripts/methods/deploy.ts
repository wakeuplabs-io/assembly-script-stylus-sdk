import { PublicClient, WalletClient, Account, createWalletClient, http } from "viem";
import { CONTRACT_PATHS } from "../utils/constants.js";
import { DeploymentMetrics } from "../../../shared/types/performance.js";
import { privateKeyToAccount } from "viem/accounts";

async function testDeploymentPerformance(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractName: keyof typeof CONTRACT_PATHS,
): Promise<DeploymentMetrics> {
  const startTime = Date.now();
  const deploymentTx = await walletClient.deployContract({
    abi: CONTRACT_PATHS[contractName].abi,
    bytecode: CONTRACT_PATHS[contractName].bytecode,
    chain: walletClient.chain,
    account: walletClient.account as Account,
    args: CONTRACT_PATHS[contractName].args,
  });

  const endTime = Date.now();
  const deploymentTime = endTime - startTime;

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deploymentTx,
    confirmations: 1,
  });

  const metrics: DeploymentMetrics = {
    deploymentTime,
    size: CONTRACT_PATHS[contractName].bytecodeSize.toString(),
    gasUsed: receipt.gasUsed.toString(),
    address: receipt.contractAddress as string,
    transactionHash: deploymentTx,
    contractName,
  };

  return metrics;
}

export async function deploy(
  contractName: keyof typeof CONTRACT_PATHS,
): Promise<DeploymentMetrics> {
  try {
    const { network } = await import("hardhat");
    const { viem } = (await network.connect("arbitrumSepolia")) as any;
    const publicClient = await viem.getPublicClient();
    const walletClient = await createWalletClient({
      account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
      transport: http(process.env.RPC_URL),
    });

    const result = await testDeploymentPerformance(publicClient, walletClient, contractName);

    return result;
  } catch (error) {
    throw new Error(`Direct performance test failed: ${error}`);
  }
}
