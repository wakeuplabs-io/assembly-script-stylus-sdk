import { readFileSync } from "fs";
import { WalletClient } from "viem";

import { DecodedError } from "@/__tests__/helpers/types.js";

import { ContractArgs, ContractService } from "./types.js";

/**
 * Handles deployment errors in a consistent way across all e2e tests
 * @param error The error that occurred during deployment
 * @throws Error with formatted message
 */
export function handleDeploymentError(error: unknown): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("❌ Failed to deploy contract:", errorMessage);

  if (error instanceof Error) {
    console.error("Stack trace:", error.stack);
  }

  throw new Error(`Contract deployment failed: ${errorMessage}`);
}

export function getAbi(abiPath: string) {
  return JSON.parse(readFileSync(abiPath, "utf-8"));
}

/**
 * Expects a revert error from a contract call
 * @param contract - Contract service
 * @param functionName - Name of the function to call
 * @param args - Arguments to pass to the function
 * @returns - Decoded error
 */
export async function expectRevert(
  contract: ContractService,
  functionName: string,
  args: ContractArgs = [],
): Promise<DecodedError> {
  const result = await contract.readRaw(functionName, args);

  if (result.success) {
    throw new Error("Expected revert but call succeeded");
  }

  if (!result.error) {
    throw new Error("Expected error but none found");
  }

  return {
    errorName: result.error.name,
    args: result.error.args,
  };
}

/**
 * Expects a revert error from a contract write
 * @param contract - Contract service
 * @param walletClient - Wallet client to use for the write operation (must be funded)
 * @param functionName - Name of the function to call
 * @param args - Arguments to pass to the function
 * @returns - Decoded error
 */
export async function expectRevertWrite(
  contract: ContractService,
  walletClient: WalletClient,
  functionName: string,
  args: ContractArgs = [],
): Promise<DecodedError> {
  const result = await contract.writeRaw(walletClient, functionName, args);

  if (result.success) {
    throw new Error("Expected revert but write succeeded");
  }

  return {
    errorName: result.error?.name || "Unknown",
    args: result.error?.args || [],
  };
}
