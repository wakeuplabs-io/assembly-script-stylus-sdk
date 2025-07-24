import { Command } from "commander";
import path from "path";

import { Logger } from "@/cli/services/logger.js";
import { DEPLOYMENT_INFO_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

import { DeployRunner } from "./deploy-runner.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

function parseDeploymentOutput(deploymentOutput: string, contractPath: string, endpoint: string) {
  const ansiPattern = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
  const cleanOutput = deploymentOutput.replace(ansiPattern, "");

  const addressMatch = cleanOutput.match(/deployed code at address:\s*([0-9a-fA-Fx]+)/);
  const txHashMatch = cleanOutput.match(/deployment tx hash:\s*([0-9a-fA-Fx]+)/);
  const sizeMatch = cleanOutput.match(/contract size:\s*([0-9]+\s*B)/);
  const toolchainMatch = cleanOutput.match(/toolchain\s*([0-9.]+)/);

  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    contractPath,
    endpoint,
    deployment: {
      contractAddress: addressMatch ? addressMatch[1] : null,
      transactionHash: txHashMatch ? txHashMatch[1] : null,
      contractSize: sizeMatch ? sizeMatch[1] : null,
      toolchainVersion: toolchainMatch ? toolchainMatch[1] : null,
      status: addressMatch && txHashMatch ? "success" : "unknown",
    },
    rawOutput: cleanOutput.trim(),
  };

  return deploymentInfo;
}

function saveDeploymentInfo(deploymentOutput: string, contractPath: string, endpoint: string) {
  const deploymentInfo = parseDeploymentOutput(deploymentOutput, contractPath, endpoint);
  writeFile(DEPLOYMENT_INFO_PATH, JSON.stringify(deploymentInfo, null, 2));
  Logger.getInstance().info(`Deployment information saved to: ${DEPLOYMENT_INFO_PATH}`);

  if (deploymentInfo.deployment.contractAddress) {
    Logger.getInstance().info(
      `Contract deployed at address: ${deploymentInfo.deployment.contractAddress}`,
    );
  }
  if (deploymentInfo.deployment.transactionHash) {
    Logger.getInstance().info(`Transaction hash: ${deploymentInfo.deployment.transactionHash}`);
  }
}

export function runDeploy(
  contractPath: string,
  options: { privateKey: string; endpoint: string; output?: string },
) {
  const contractsRoot = path.resolve(process.cwd());

  const errorManager = new ErrorManager();
  const runner = new DeployRunner(contractsRoot, errorManager);
  runner.validate();
  const deploymentOutput = runner.deploy(contractPath, options);

  saveDeploymentInfo(deploymentOutput, contractPath, options.endpoint);
  return deploymentOutput;
}

export const deployCommand = new Command("deploy")
  .description("Deploy an AssemblyScript Contract")
  .argument("<contract-path>", "Path to the contract file")
  .option("--private-key <private-key>", "Private key to deploy the contract")
  .option("--endpoint <endpoint>", "Endpoint to deploy the contract")
  .option("--output <output-file>", "Save deployment information to a JSON file")
  .action(
    (contractPath: string, options: { privateKey: string; endpoint: string; output?: string }) => {
      runDeploy(contractPath, options);
    },
  );
