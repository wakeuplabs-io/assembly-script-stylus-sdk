/**
 * Secure input utilities for sensitive data like private keys
 */

import promptSync from "prompt-sync";

const prompt = promptSync({ sigint: true });

export function promptPrivateKey(): string {
  console.log("[!] Private Key Required for Deployment");
  console.log("Your private key will not be displayed on screen for security.");
  console.log("");

  const rawPrivateKey = prompt("Enter your wallet private key: ", { echo: "*" });

  if (!rawPrivateKey || rawPrivateKey.trim() === "") {
    console.log("[X] Private key is required for deployment");
    process.exit(1);
  }

  let privateKey = rawPrivateKey.trim();

  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  return privateKey;
}

export function displayDeploymentStart(contractPath: string, endpoint: string): void {
  console.log("");
  console.log(">> AS-Stylus Contract Deployment");
  console.log("=".repeat(40));
  console.log(`Contract: ${contractPath}`);
  console.log(`Network:  ${endpoint}`);
  console.log("");
}

export function displayValidationStep(message: string): void {
  console.log(`[+] ${message}`);
}

export function displayDeploymentStep(message: string): void {
  console.log(`[~] ${message}`);
}

export function displaySuccess(message: string): void {
  console.log(`[+] ${message}`);
}

export function clearSensitiveData(data: string): void {
  if (data && typeof data === "string") {
    for (let i = 0; i < data.length; i++) {
      data = data.substring(0, i) + "*" + data.substring(i + 1);
    }
  }
}
