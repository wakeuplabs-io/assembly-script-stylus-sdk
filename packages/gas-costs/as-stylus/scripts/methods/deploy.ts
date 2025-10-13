import { DeploymentMetrics } from "../../../shared/types/performance.js";
import { CONTRACT_PATHS } from "../config/constants.js";
import { run } from "../utils/system-helpers.js";
import { getAbi, parseDeploymentOutput } from "../utils/utils.js";
import env from "../config/env.js";
import { getWalletClient, publicClient } from "../config/clients.js";
import { Abi, Account, PublicClient, WalletClient } from "viem";
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

async function testDeploymentPerformance(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractName: keyof typeof CONTRACT_PATHS,
): Promise<DeploymentMetrics> {
  const contract = CONTRACT_PATHS[contractName];
  const abi = getAbi(contract.abi);

  const constructorArgs = contract.args;

  const startTime = Date.now();
  const counter = await deployContract(
    contract.contract,
    env.PRIVATE_KEY,
    env.RPC_URL,
    contract.contractName,
  );

  const endTime = Date.now();

  let deploymentTime = endTime - startTime;
  const output = parseDeploymentOutput(counter);

  // TODO: get gas price and total cost from tx hash
  const receipt = await publicClient.getTransactionReceipt({ hash: output.transactionHash });
  let gasUsed = receipt.gasUsed;

  if (contractName === "ERC20") {
    const startTimeConstructor = Date.now();
    const constructorTx = await walletClient.writeContract({
      address: receipt.contractAddress as `0x${string}`,
      abi: abi as unknown as Abi,
      chain: walletClient.chain,
      account: walletClient.account as Account,
      functionName: "erc20_constructor",
      args: constructorArgs,
    });
    const endTimeConstructor = Date.now();
    const constructorTime = endTimeConstructor - startTimeConstructor;
    deploymentTime += constructorTime;

    const constructorReceipt = await publicClient.waitForTransactionReceipt({
      hash: constructorTx,
    });
    gasUsed += constructorReceipt.gasUsed;
  }

  const metrics: DeploymentMetrics = {
    deploymentTime,
    address: output.address,
    size: output.size,
    gasUsed: gasUsed.toString(),
    transactionHash: output.transactionHash,
  };

  return metrics;
}

export async function deploy(
  contractName: keyof typeof CONTRACT_PATHS,
): Promise<DeploymentMetrics> {
  const walletClient = getWalletClient();
  const result = await testDeploymentPerformance(publicClient, walletClient, contractName);

  return result;
}
