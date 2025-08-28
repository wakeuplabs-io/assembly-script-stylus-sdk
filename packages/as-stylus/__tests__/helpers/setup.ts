import { Address, WalletClient } from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { contractService, ContractService } from "./client.js";
import { PRIVATE_KEY, RPC_URL } from "./constants.js";
import { getAbi, parseDeploymentOutput, run } from "./utils.js";

export type ContractArgs = (string | boolean | Address | bigint)[];

/**
 * Deploys contract directly using DeployRunner (non-interactive)
 * @param contractPath Path to the contract
 * @param privateKey Private key to use
 * @param endpoint RPC endpoint
 * @returns Deploy command output
 */
function deployContract(contractPath: string, privateKey: string, endpoint: string): string {
  const wasmPath = `${contractPath}/artifacts/build/contract.wasm`;
  const command = `cargo stylus deploy --wasm-file ${wasmPath} --private-key ${privateKey} --endpoint ${endpoint} --no-verify`;

  const deploymentOutput = run(command);

  return deploymentOutput;
}

/**
 * Complete setup for e2e tests: build, deploy, and initialize contract
 * @param contractPath Path to the contract
 * @param abiPath Path to the ABI file
 * @param options Configuration options
 * @returns Object with contractAddr and contract service
 */
export async function setupE2EContract(
  contractPath: string,
  abiPath: string,
  _options: {
    constructorName?: string;
    deployArgs?: ContractArgs;
    walletClient?: WalletClient;
  } = {},
): Promise<ContractService> {
  // Build and compile the contract
  run(`npx as-stylus compile contract.ts --endpoint ${RPC_URL}`, contractPath);

  const abi = getAbi(abiPath);

  const deployLog = deployContract(contractPath, PRIVATE_KEY, RPC_URL);
  const contractAddr = parseDeploymentOutput(deployLog);

  console.log("📍 Contract deployed at:", contractAddr);

  // Create contract service
  const contract = contractService(contractAddr as Address, abi, false);

  // Execute constructor if args provided
  if (_options.deployArgs && _options.deployArgs.length > 0) {
    console.log("🔧 Executing constructor with args:", _options.deployArgs);
    
    // Look for constructor in ABI (usually named "contract_constructor")
    const constructor = abi.find(
      (method: { name: string }) =>
        method.name === "contract_constructor" || method.name === "constructor",
    );

    if (constructor) {
      console.log("🔍 Found constructor:", constructor.name);
      
      // Create wallet client for constructor execution
      const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace('0x', '')}`);
      const walletClient = createWalletClient({
        account,
        chain: { id: 412346, name: 'Arbitrum Local', rpcUrls: { default: { http: [RPC_URL] } }, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 } },
        transport: http(RPC_URL),
      });
      
      await contract.write(walletClient, constructor.name, _options.deployArgs);
      console.log("✅ Constructor executed successfully");
    } else {
      console.log("⚠️ No constructor found in ABI");
      console.log(
        "🔍 Available methods:",
        abi.map((m: { name: string }) => m.name),
      );
    }
  }

  return contract;
}

/**
 * Funds a user address with ETH for gas
 * @param userAddress User address to fund
 */
export function fundUser(userAddress: string): void {
  run(
    `cast send ${userAddress} --value 0.1ether --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
  );
}

/**
 * Gets the ETH balance of an address
 * @param address Address to check balance for
 * @returns Balance in wei as bigint
 */
export function getBalance(address: string): bigint {
  const balanceOutput = run(`cast balance ${address} --rpc-url ${RPC_URL}`);
  return BigInt(balanceOutput.trim());
}
