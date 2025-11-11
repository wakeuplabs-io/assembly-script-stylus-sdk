import { Address, PublicClient, WalletClient } from "viem";

import { contractService } from "./contract-service.js";
import { run, parseDeploymentOutput } from "./system-helpers.js";
import { ContractArgs } from "./types.js";
import { getAbi } from "./utils.js";

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
  root: string,
): string {
  const contractName = contractPath.split("/").pop()?.replace(/\.ts$/, "");
  const wasmPath = `${root}/artifacts/build/${contractName}.wasm`;
  const command = `cargo stylus deploy --wasm-file ${wasmPath} --private-key ${privateKey} --endpoint ${endpoint} --no-verify`;

  const deploymentOutput = run(command, root);

  return deploymentOutput;
}

/**
 * Complete setup for e2e tests: build, deploy, and initialize contract with constructor execution
 * @param contractPath Path to the contract directory
 * @param abiPath Path to the ABI file
 * @param options Configuration options including contract filename and deploy args
 * @returns Contract service instance with deployed contract
 */
export async function setup(
  publicClient: PublicClient,
  contractPath: string,
  abiPath: string,
  options: {
    endpoint: string;
    privateKey: string;
    constructorName: string;
    deployArgs?: ContractArgs;
    walletClient: WalletClient;
    verbose?: boolean;
    root: string;
  },
): Promise<ReturnType<typeof contractService>> {
  run(
    `npx @wakeuplabs/as-stylus compile ${contractPath} --endpoint ${options.endpoint}`,
    options.root,
  );

  const abi = getAbi(abiPath);

  const deployLog = deployContract(
    contractPath,
    options.privateKey,
    options.endpoint,
    options.root,
  );
  const contractAddr = parseDeploymentOutput(deployLog);

  console.log("📍 Contract deployed at:", contractAddr);

  // Create contract service
  const contract = contractService(publicClient, contractAddr as Address, abi, false);

  const constructor = abi.find(
    (method: { name: string }) => method.name === options.constructorName,
  );

  if (constructor) {
    const constructorArgs = options.deployArgs || [];
    console.log("🔧 Executing constructor with args:", constructorArgs);
    console.log("🔍 Found constructor:", constructor.name);

    await contract.write(options.walletClient, constructor.name, constructorArgs);
    console.log("✅ Constructor executed successfully");
  } else {
    console.log("ℹ️ No constructor defined in contract - skipping constructor call");
  }

  return contract;
}

/**
 * Funds a user address with ETH for gas
 * @param userAddress User address to fund
 * @param privateKey Private key to use
 * @param endpoint RPC endpoint
 * @param root Root directory
 */
export function fundUser(
  userAddress: string,
  privateKey: string,
  endpoint: string,
  root: string,
): void {
  run(
    `cast send ${userAddress} --value 0.1ether --private-key ${privateKey} --rpc-url ${endpoint}`,
    root,
  );
}

/**
 * Gets the ETH balance of an address
 * @param address Address to check balance for
 * @param endpoint RPC endpoint
 * @param root Root directory
 * @returns Balance in wei as bigint
 */
export function getBalance(address: string, endpoint: string, root: string): bigint {
  const balanceOutput = run(`cast balance ${address} --rpc-url ${endpoint}`, root);
  return BigInt(balanceOutput.trim());
}
