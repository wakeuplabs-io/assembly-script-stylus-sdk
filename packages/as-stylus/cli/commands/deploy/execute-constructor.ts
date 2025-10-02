import { Address } from "viem";

import { getAbi } from "@/cli/commands/deploy/get-abi.js";
import { Logger } from "@/cli/services/logger.js";
import { ContractService } from "@/cli/utils/client.js";

function getConstructor(contractPath: string, constructorArgs: string[]) {
  const abi = getAbi(contractPath);
  const constructor = abi.find(
    (method: { name: string; inputs: { name: string }[] }) =>
      method.name.includes("_constructor") && method.inputs.length === constructorArgs.length,
  );
  if (!constructor) {
    Logger.getInstance().info("No constructor found");
    return;
  }

  return constructor;
}

export async function executeConstructor(
  contractPath: string,
  contractAddress: Address,
  privateKey: string,
  endpoint: string,
  constructorArgs?: string[],
) {
  const abi = getAbi(contractPath);
  const contractService = await ContractService.create(contractAddress, abi, privateKey, endpoint);

  const constructor = getConstructor(contractPath, constructorArgs ?? []);
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
