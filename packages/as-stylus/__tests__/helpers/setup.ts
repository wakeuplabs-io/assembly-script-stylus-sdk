import { Address, WalletClient } from "viem";

import { contractService, ContractService } from "./client.js";
import { PRIVATE_KEY, RPC_URL, PROJECT_ROOT } from "./constants.js";
import { getAbi, run, stripAnsi } from "./utils.js";

export type ContractArgs = (string | boolean | Address | bigint)[];

/**
 * Complete setup for e2e tests: build, deploy, and initialize contract
 * @param contractPath Path to the contract
 * @param abiPath Path to the ABI file
 * @param CONTRACT_ADDRESS_REGEX Regex to extract contract address
 * @param options Configuration options
 * @returns Object with contractAddr and contract service
 */
export async function setupE2EContract(
  contractPath: string,
  abiPath: string,
  CONTRACT_ADDRESS_REGEX: RegExp,
  options: {
    constructorName?: string;
    deployArgs?: ContractArgs;
    walletClient?: WalletClient;
  } = {},
): Promise<ContractService> {
  const { deployArgs, walletClient, constructorName = "contract_constructor" } = options;

  // Build and compile the contract
  run("npm run pre:build", PROJECT_ROOT);
  run("npx as-stylus build contract.ts", contractPath);
  run("npm run compile", contractPath);
  run("npm run check", contractPath);

  const abi = getAbi(abiPath);

  // Deploy the contract
  const deployLog = stripAnsi(
    run(`PRIVATE_KEY=${PRIVATE_KEY} RPC_URL=${RPC_URL} npm run deploy`, contractPath),
  );

  const addressMatch = deployLog.match(CONTRACT_ADDRESS_REGEX);
  if (!addressMatch) {
    throw new Error(`Could not extract contract address from deployment log: ${deployLog}`);
  }

  const contractAddr = addressMatch[1];
  console.log("📍 Contract deployed at:", contractAddr);

  const contract = contractService(contractAddr as Address, abi, false);

  if (deployArgs !== undefined && walletClient) {
    await contract.write(walletClient, constructorName, deployArgs);
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
