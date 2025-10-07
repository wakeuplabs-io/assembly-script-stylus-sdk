import { DeploymentMetrics } from "../../../shared/types/performance.js";

async function testDeploymentPerformance(viem: any, publicClient: any): Promise<DeploymentMetrics> {
  console.log("🚀 Starting Counter contract deployment performance test...");

  const startTime = Date.now();

  const counter = await viem.deployContract("Counter");

  const endTime = Date.now();
  const deploymentTime = endTime - startTime;

  const gasPrice = await publicClient.getGasPrice();

  const estimatedGasUsed = 200000n;
  const totalCost = estimatedGasUsed * gasPrice;

  const metrics: DeploymentMetrics = {
    gasUsed: estimatedGasUsed.toString(),
    deploymentTime,
    gasPrice: gasPrice.toString(),
    totalCost: totalCost.toString(),
  };

  // Log the results
  console.log("📊 Deployment Performance Metrics:");
  console.log(`   Estimated Gas Used: ${estimatedGasUsed.toLocaleString()} gas`);
  console.log(`   Gas Price: ${gasPrice.toLocaleString()} wei`);
  console.log(`   Estimated Total Cost: ${totalCost.toLocaleString()} wei`);
  console.log(`   Deployment Time: ${deploymentTime}ms`);
  console.log(`   Contract Address: ${counter.address}`);

  console.log("✅ Deployment performance test completed successfully!");

  return metrics;
}

export async function deploy(): Promise<DeploymentMetrics> {
  try {
    const { network } = await import("hardhat");
    const { viem } = (await network.connect("arbitrumSepolia")) as any;
    const publicClient = await viem.getPublicClient();

    const result = await testDeploymentPerformance(viem, publicClient);

    return result;
  } catch (error) {
    throw new Error(`Direct performance test failed: ${error}`);
  }
}
