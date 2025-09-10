import { Address, WalletClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { contractService, ContractService } from "./client.js";
import { PRIVATE_KEY, RPC_URL } from "./constants.js";
import { getAbi, parseDeploymentOutput, run } from "./utils.js";

export type ContractArgs = (string | boolean | Address | bigint | (string | boolean | Address | bigint)[])[];

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

/**
 * Complete setup for e2e tests: build, deploy, and initialize contract with constructor execution
 * @param contractPath Path to the contract directory
 * @param abiPath Path to the ABI file
 * @param options Configuration options including contract filename and deploy args
 * @returns Contract service instance with deployed contract
 */
export async function setupE2EContract(
  contractPath: string,
  abiPath: string,
  _options: {
    contractFileName?: string;
    constructorName?: string;
    deployArgs?: ContractArgs;
    walletClient?: WalletClient;
  } = {},
): Promise<ContractService> {
  const fileName = _options.contractFileName || "contract.ts";
  run(`npx as-stylus compile ${fileName} --endpoint ${RPC_URL}`, contractPath);

  const abi = getAbi(abiPath);

  const contractName = fileName.replace(/\.ts$/, "");
  const deployLog = deployContract(contractPath, PRIVATE_KEY, RPC_URL, contractName);
  const contractAddr = parseDeploymentOutput(deployLog);

  console.log("📍 Contract deployed at:", contractAddr);

  // Create contract service
  const contract = contractService(contractAddr as Address, abi, false);

  const constructor = abi.find(
    (method: { name: string }) =>
      method.name === "contract_constructor" ||
      method.name === "constructor" ||
      method.name.endsWith("_constructor"),
  );

  if (constructor) {
    const constructorArgs = _options.deployArgs || [];
    console.log("🔧 Executing constructor with args:", constructorArgs);
    console.log("🔍 Found constructor:", constructor.name);

    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace("0x", "")}`);
    const walletClient = createWalletClient({
      account,
      chain: {
        id: 412346,
        name: "Arbitrum Local",
        rpcUrls: { default: { http: [RPC_URL] } },
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      },
      transport: http(RPC_URL),
    });

    await contract.write(walletClient, constructor.name, constructorArgs);
    console.log("✅ Constructor executed successfully");
  } else {
    console.log("ℹ️ No constructor defined in contract - skipping constructor call");
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
