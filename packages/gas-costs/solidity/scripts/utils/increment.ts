import { assert } from "chai";
import { network } from "hardhat";
import { IncrementMetrics } from "../../../shared/types/performance.js";

async function testIncrementPerformance(viem: any, publicClient: any): Promise<IncrementMetrics> {
  console.log("🔍 Testing increment operation performance...");

  const counter = await viem.deployContract("Counter");
  console.log(`📋 Using contract at: ${counter.address}`);

  const startTime = Date.now();

  console.log("📤 Sending increment transaction...");
  const incTx = await counter.write.inc();
  console.log(`📋 Transaction hash: ${incTx}`);

  console.log("⏳ Waiting for transaction to be mined...");
  let incReceipt;

  try {
    if (typeof publicClient.waitForTransactionReceipt === "function") {
      incReceipt = await publicClient.waitForTransactionReceipt({
        hash: incTx,
        timeout: 60 * 1_000, // 60 seconds
      });
    }
  } catch (error) {
    console.error("❌ Error waiting for transaction receipt:", error);
    throw error;
  }

  console.log("✅ Transaction mined successfully!");

  const endTime = Date.now();
  const executionTime = endTime - startTime;

  const functionCallGas = incReceipt.gasUsed;
  const gasPrice = await publicClient.getGasPrice();
  const totalCost = BigInt(functionCallGas) * BigInt(gasPrice);

  const metrics: IncrementMetrics = {
    gasUsed: functionCallGas.toString(),
    executionTime,
    gasPrice: gasPrice.toString(),
    totalCost: totalCost.toString(),
    transactionHash: incTx,
  };

  console.log("📊 Increment Performance Metrics:");
  console.log(`   Function Call Gas: ${functionCallGas.toLocaleString()} gas`);
  console.log(`   Gas Price: ${gasPrice.toLocaleString()} wei`);
  console.log(`   Total Cost: ${totalCost.toLocaleString()} wei`);
  console.log(`   Execution Time: ${executionTime}ms`);
  console.log(`   Transaction Hash: ${incTx}`);

  const value = await counter.read.x();
  assert.equal(value, 1n, "Counter should be incremented to 1");

  console.log("✅ Increment performance test completed successfully!");

  return metrics;
}

export async function increment(): Promise<IncrementMetrics> {
  const { viem } = (await network.connect("arbitrumSepolia")) as any;
  const publicClient = await viem.getPublicClient();
  return testIncrementPerformance(viem, publicClient);
}
