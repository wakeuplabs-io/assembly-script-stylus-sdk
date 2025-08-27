import { Address } from "viem";

import { getAbi } from "@/cli/commands/deploy/get-abi.js";
import { Logger } from "@/cli/services/logger.js";
import { ContractService } from "@/cli/utils/client.js";

export async function executeConstructor(
  contractPath: string,
  contractAddress: Address,
  privateKey: string,
  endpoint: string,
  constructorArgs?: string[],
) {
  const abi = getAbi(contractPath);
  const contractService = await ContractService.create(contractAddress, abi, privateKey, endpoint);

  const constructor = abi.find((method: { name: string }) => method.name.includes("_constructor"));
  if (!constructor) {
    Logger.getInstance().info("No constructor found");
    return;
  }

  const constructorInputNames = constructor.inputs.map((input: { name: string }) => input.name);
  const argsToUse = constructorArgs || constructorInputNames;

  const tx = await contractService.write(constructor.name, argsToUse);

  Logger.getInstance().info(`Constructor arguments: ${JSON.stringify(argsToUse)}`);
  Logger.getInstance().info(`Transaction hash: ${tx}`);
}
