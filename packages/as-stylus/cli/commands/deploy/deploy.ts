import { Command } from "commander";
import path from "path";
import { Address } from "viem";

import { Logger } from "@/cli/services/logger.js";
import { DEPLOYMENT_INFO_PATH } from "@/cli/utils/constants.js";
import { findErrorTemplate, createErrorMessage } from "@/cli/utils/error-messages.js";
import { writeFile } from "@/cli/utils/fs.js";
import { ValidationUtils } from "@/cli/utils/validation.js";

import { DeployRunner } from "./deploy-runner.js";
import { executeConstructor } from "./execute-constructor.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

function parseDeploymentOutput(deploymentOutput: string, contractPath: string, endpoint: string) {
  const ansiPattern = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
  const cleanOutput = deploymentOutput.replace(ansiPattern, "");

  const addressMatch = cleanOutput.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
  const txHashMatch = cleanOutput.match(/deployment tx hash:\s*(0x[0-9a-fA-F]{64})/i);
  const sizeMatch = cleanOutput.match(/contract size:\s*([0-9]+\s*B)/i);
  const toolchainMatch = cleanOutput.match(/toolchain\s*([0-9.]+)/i);

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

  return deploymentInfo;
}

export function runDeploy(
  contractPath: string,
  options: {
    privateKey: string;
    endpoint?: string;
    output?: string;
    constructorArgs?: string[];
  },
) {
  const contractsRoot = path.resolve(process.cwd());

  // Validate inputs before deployment
  const validationResults = [
    ValidationUtils.validateContractFile(contractPath),
    ValidationUtils.validatePrivateKey(options.privateKey),
    ValidationUtils.validateRpcUrl(options.endpoint || "https://sepolia-rollup.arbitrum.io/rpc"),
    ValidationUtils.validateConstructorArgs(options.constructorArgs || []),
  ];

  const combinedValidation = ValidationUtils.combineValidationResults(validationResults);
  if (!combinedValidation.isValid) {
    const errorMessage = createErrorMessage({
      title: "Validation Failed",
      description: combinedValidation.message || "One or more deployment parameters are invalid",
      solution: combinedValidation.suggestion || "Check the error details above and fix the issues",
    });

    Logger.getInstance().error(errorMessage);
    process.exit(1);
  }

  const errorManager = new ErrorManager();
  const runner = new DeployRunner(contractsRoot, errorManager);

  try {
    runner.validate();
    const deploymentOutput = runner.deploy(contractPath, options);

    const defaultEndpoint = "https://sepolia-rollup.arbitrum.io/rpc";
    const finalEndpoint = options.endpoint || defaultEndpoint;
    const deploymentInfo = saveDeploymentInfo(deploymentOutput, contractPath, finalEndpoint);

    executeConstructor(
      contractPath,
      deploymentInfo.deployment.contractAddress as Address,
      options.privateKey,
      finalEndpoint,
      options.constructorArgs,
    );

    return deploymentInfo;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const template = findErrorTemplate(errorMessage);

    if (template) {
      const actionableMessage = createErrorMessage(template);
      Logger.getInstance().error(actionableMessage);
    } else {
      const genericError = createErrorMessage({
        title: "Deployment Failed",
        description: errorMessage,
        solution: "Check your contract code, network connection, and try again",
        moreInfo: "Ensure you have sufficient funds and the RPC endpoint is accessible",
      });
      Logger.getInstance().error(genericError);
    }

    process.exit(1);
  }
}

export const deployCommand = new Command("deploy")
  .description("Deploy an AssemblyScript Contract")
  .argument("<contract-path>", "Path to the contract file")
  .option("--private-key <private-key>", "Private key to deploy the contract")
  .option("--endpoint <endpoint>", "Endpoint to deploy the contract (defaults to Arbitrum Sepolia)")
  .option("--output <output-file>", "Save deployment information to a JSON file")
  .option("--constructor-args <constructor-args...>", "Constructor arguments")
  .action(
    (
      contractPath: string,
      options: {
        privateKey: string;
        endpoint?: string;
        output?: string;
        constructorArgs?: string[];
      },
    ) => {
      runDeploy(contractPath, options);
    },
  );
