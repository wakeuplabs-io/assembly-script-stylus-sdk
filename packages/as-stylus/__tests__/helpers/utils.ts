// ---------------------------------------------------------------
//  Utils — build / deploy / call helpers for Stylus e2e tests
// ---------------------------------------------------------------
import { readFileSync } from "fs";

import { DecodedError } from "./types.js";

export {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
  run,
  stripAnsi,
} from "./system-helpers.js";

// Re-export format helpers
export { pad64, padAddress, padBool, calldata } from "./format-helpers.js";

// Re-export contract helpers
export { getFunctionSelector, createContractHelpers } from "./contract-helpers.js";

// Re-export struct ABI analysis utilities
export {
  parseStructABIResponse,
  validateStructABIFormat,
  validateStructFieldValues,
  calculateExpectedStructSize,
  validateStringContentInABI,
} from "./struct-abi-analyzer.js";

export { type StructABIAnalysis } from "./types.js";

export function getAbi(abiPath: string) {
  return JSON.parse(readFileSync(abiPath, "utf-8"));
}

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

export async function expectRevert(
  contract: any,
  functionName: string,
  args: any[] = [],
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

export async function expectWriteRevert(
  contract: any,
  functionName: string,
  args: any[] = [],
): Promise<DecodedError> {
  const result = await contract.writeRaw(functionName, args);

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

export function parseDeploymentOutput(deploymentOutput: string) {
  const match = deploymentOutput.match(/Contract deployed at address: (0x[a-fA-F0-9]{40})/);
  if (!match) {
    throw new Error(`Could not extract contract address from deployment log: ${deploymentOutput}`);
  }
  return match[1];
}
