import { DeploymentMetrics } from "../../../shared/types/performance.js";
import { CONTRACT_PATHS } from "../config/constants.js";
import { run } from "./system-helpers.js";
import { parseDeploymentOutput } from "./utils.js";
import env from "../config/env.js";
import { publicClient } from "../config/clients.js";
import { PublicClient } from "viem";
/**
 * Deploys contract directly using DeployRunner (non-interactive)
 * @param contractPath Path to the contract
 * @param privateKey Private key to use
 * @param endpoint RPC endpoint
 * @param contractName Name of the contract file (without .ts extension)
 * @returns Deploy command output
 */
function deployContract(
  contractPath: string,
  privateKey: string,
  endpoint: string,
  contractName: string = "contract",
): string {
  const wasmPath = `${contractPath}/artifacts/build/${contractName}.wasm`;
  const command = `cargo stylus deploy --wasm-file ${wasmPath} --private-key ${privateKey} --endpoint ${endpoint} --no-verify`;

  const deploymentOutput = run(command);

  return deploymentOutput;
}

async function testDeploymentPerformance(publicClient: PublicClient): Promise<DeploymentMetrics> {
  console.log("🚀 Starting Counter contract deployment performance test...");
  const { COUNTER } = CONTRACT_PATHS;

  const startTime = Date.now();
  const counter = await deployContract(COUNTER.contract, env.PRIVATE_KEY, env.RPC_URL, "contract");
  const endTime = Date.now();

  const deploymentTime = endTime - startTime;
  const output = parseDeploymentOutput(counter);

  // TODO: get gas price and total cost from tx hash
  const receipt = await publicClient.getTransactionReceipt({ hash: output.transactionHash });

  const metrics: DeploymentMetrics = {
    deploymentTime,
    address: output.address,
    size: output.size,
    gasUsed: receipt.gasUsed.toString(),
    transactionHash: output.transactionHash,
  };

  // Log the results
  console.log("📊 Deployment Performance Metrics:");
  console.log(`   Deployment Time: ${deploymentTime}ms`);
  console.log(`   Contract Address: ${output.address}`);

  console.log("✅ Deployment performance test completed successfully!");

  return metrics;
}

export async function deploy(): Promise<DeploymentMetrics> {
  try {
    const result = await testDeploymentPerformance(publicClient);

    return result;
  } catch (error) {
    throw new Error(`Direct performance test failed: ${error}`);
  }
}
