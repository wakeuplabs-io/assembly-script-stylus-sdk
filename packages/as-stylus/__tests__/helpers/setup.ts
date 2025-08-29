import { Address, WalletClient } from "viem";

import { contractService, ContractService } from "./client.js";
import { PRIVATE_KEY, RPC_URL } from "./constants.js";
import { getAbi, parseDeploymentOutput, run } from "./utils.js";

export type ContractArgs = (string | boolean | Address | bigint)[];

/**
 * Creates the deploy command for the contract
 * @param options Configuration options
 * @returns The deploy command
 */
function createDeployCommand(options: {
  constructorName?: string;
  deployArgs?: ContractArgs;
  walletClient?: WalletClient;
}) {
  const deployArgs = options.deployArgs?.reduce((acc, arg) => `${acc} ${arg}`, "");
  const baseCommand = `npx as-stylus deploy contract.ts --endpoint ${RPC_URL} --private-key ${PRIVATE_KEY}`;

  if (deployArgs) {
    return `${baseCommand} --constructor-args ${deployArgs}`;
  }

  return baseCommand;
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
  options: {
    constructorName?: string;
    deployArgs?: ContractArgs;
    walletClient?: WalletClient;
    verbose?: boolean;
  } = {},
): Promise<ContractService> {
  // Build and compile the contract
  run(`npx as-stylus compile contract.ts --endpoint ${RPC_URL}`, contractPath);

  const abi = getAbi(abiPath);

  const deployLog = run(createDeployCommand(options), contractPath);
  const contractAddr = parseDeploymentOutput(deployLog);

  console.log("📍 Contract deployed at:", contractAddr);

  return contractService(contractAddr as Address, abi, options.verbose ?? false);
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
