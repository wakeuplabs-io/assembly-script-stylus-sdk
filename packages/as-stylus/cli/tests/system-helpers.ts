import { execSync } from "child_process";

/**
 * Runs a command and returns the output
 * @param cmd - Command to run
 * @param cwd - Current working directory
 * @param allowErr - Whether to allow errors
 * @returns - Output of the command
 */
export function run(cmd: string, cwd: string, allowErr = false): string {
  try {
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
  } catch (e: unknown) {
    if (!allowErr) throw e;
    const out = (e as { stdout?: string }).stdout ?? "";
    const err = (e as { stderr?: string }).stderr ?? "";
    return (out + err).trim();
  }
}

// Simple ANSI strip function without external dependency
/**
 * Strips ANSI escape codes from a string
 * @param s - String to strip ANSI escape codes from
 * @returns - String with ANSI escape codes removed
 */
export const stripAnsi = (s: string): string => {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
};

/**
 * Parses the deployment output and returns the contract address
 * @param deploymentOutput - Deployment output
 * @returns - Contract address
 */
export function parseDeploymentOutput(deploymentOutput: string): string {
  // eslint-disable-next-line no-control-regex
  const cleanOutput = deploymentOutput.replace(/\u001b\[[0-9;]*m/g, "");

  const patterns = [
    /deployed code at address:\s*(0x[a-fA-F0-9]{40})/, // cargo stylus pattern
    /Contract deployed at address:\s*(0x[a-fA-F0-9]{40})/, // as-stylus CLI pattern
    /deployment tx hash:\s*0x[a-fA-F0-9]{64}.*deployed code at address:\s*(0x[a-fA-F0-9]{40})/, // multiline pattern
  ];

  for (const pattern of patterns) {
    const match = cleanOutput.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not extract contract address from deployment log: ${cleanOutput}`);
}
