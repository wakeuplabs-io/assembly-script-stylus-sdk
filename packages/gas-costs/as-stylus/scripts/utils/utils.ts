import { readFileSync } from "fs";

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

export function parseDeploymentOutput(deploymentOutput: string) {
  // eslint-disable-next-line no-control-regex
  const cleanOutput = deploymentOutput.replace(/\u001b\[[0-9;]*m/g, "");

  const size = cleanOutput.match(
    /contract size:\s*([0-9.]+)\s*(KB|MB|GB|B)(?:\s*\(([0-9]+)\s*bytes\))?/,
  );
  const address = cleanOutput.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/);
  const transactionHash = cleanOutput.match(/deployment tx hash:\s*(0x[0-9a-fA-F]{64})/);

  if (!address || !transactionHash || !size) {
    console.log({ size: size?.[1], address: address?.[1], transactionHash: transactionHash?.[1] });
    throw new Error(`Could not extract contract address from deployment log: ${cleanOutput}`);
  }

  // Prefer bytes value if available, otherwise use the formatted size
  const sizeValue = size[3] ? `${size[3]} bytes` : `${size[1]} ${size[2]}`;

  return {
    size: sizeValue,
    address: address[1] as `0x${string}`,
    transactionHash: transactionHash[1] as `0x${string}`,
  };
}
