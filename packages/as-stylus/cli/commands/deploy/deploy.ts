import { Command } from "commander";
import path from "path";
import { Address } from "viem";

import { Logger } from "@/cli/services/logger.js";
import { DEPLOYMENT_INFO_PATH } from "@/cli/utils/constants.js";
import { findErrorTemplate } from "@/cli/utils/error-messages.js";
import { writeFile } from "@/cli/utils/fs.js";
import {
  ErrorCode,
  createAStylusError,
  createErrorMessage,
} from "@/cli/utils/global-error-handler.js";
import {
  promptPrivateKey,
  displayDeploymentStart,
  displayValidationStep,
  displayDeploymentStep,
  displaySuccess,
  clearSensitiveData,
} from "@/cli/utils/secure-input.js";
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
    endpoint?: string;
    output?: string;
    constructorArgs?: string[];
    privateKey?: string;
  },
) {
  const contractsRoot = path.resolve(process.cwd());
  const defaultEndpoint = "https://sepolia-rollup.arbitrum.io/rpc";
  const finalEndpoint = options.endpoint || defaultEndpoint;

  displayDeploymentStart(contractPath, finalEndpoint);

  let privateKey: string;
  if (options.privateKey) {
    privateKey = options.privateKey;
  } else {
    privateKey = promptPrivateKey();
  }

  displayValidationStep("Validating deployment parameters...");

  if (options.privateKey) {
    const privateKeyValidation = ValidationUtils.validatePrivateKey(privateKey);
    if (privateKeyValidation.correctedValue) {
      privateKey = privateKeyValidation.correctedValue;
    }
  }

  const validationResults = [
    ValidationUtils.validateContractFile(contractPath),
    ValidationUtils.validatePrivateKey(privateKey),
    ValidationUtils.validateRpcUrl(finalEndpoint),
    ValidationUtils.validateConstructorArgs(options.constructorArgs || []),
  ];

  const combinedValidation = ValidationUtils.combineValidationResults(validationResults);
  if (!combinedValidation.isValid) {
    const error = createAStylusError(
      combinedValidation.code || ErrorCode.INVALID_CONSTRUCTOR_ARGS,
      combinedValidation.message,
    );

    if (error.template) {
      const errorMessage = createErrorMessage(error.template);
      Logger.getInstance().error(errorMessage);
    } else {
      Logger.getInstance().error(`[${error.code}] ${error.message}`);
    }

    process.exit(1);
  }

  const errorManager = new ErrorManager();
  const runner = new DeployRunner(contractsRoot, errorManager);

  try {
    displayValidationStep("Validating project structure...");
    runner.validate();

    displayDeploymentStep("Deploying contract to network...");
    const deploymentOutput = runner.deploy(contractPath, {
      privateKey,
      endpoint: options.endpoint,
    });

    displayDeploymentStep("Processing deployment information...");
    const deploymentInfo = saveDeploymentInfo(deploymentOutput, contractPath, finalEndpoint);

    if (options.constructorArgs && options.constructorArgs.length > 0) {
      displayDeploymentStep("Executing constructor with arguments...");
      executeConstructor(
        contractPath,
        deploymentInfo.deployment.contractAddress as Address,
        privateKey,
        finalEndpoint,
        options.constructorArgs,
      );
    }

    displaySuccess("Deployment completed successfully!");

    // Clear private key from memory
    clearSensitiveData(privateKey);

    return deploymentInfo;
  } catch (error) {
    // Clear private key from memory on error
    clearSensitiveData(privateKey);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const template = findErrorTemplate(errorMessage);

    if (template) {
      const actionableMessage = createErrorMessage(template);
      Logger.getInstance().error(actionableMessage);
    } else {
      const genericError = createAStylusError(
        ErrorCode.CONTRACT_DEPLOYMENT_FAILED,
        errorMessage,
        error instanceof Error ? error : undefined,
      );
      const errorMsg = createErrorMessage(genericError.template!);
      Logger.getInstance().error(errorMsg);
    }

    process.exit(1);
  }
}

export const deployCommand = new Command("deploy")
  .description(
    "Deploy an AssemblyScript Contract (private key can be provided via --private-key or will be prompted securely)",
  )
  .argument("<contract-path>", "Path to the contract file")
  .option(
    "--endpoint <endpoint>",
    "RPC endpoint to deploy the contract (defaults to Arbitrum Sepolia)",
  )
  .option("--output <output-file>", "Save deployment information to a JSON file")
  .option("--constructor-args <constructor-args...>", "Constructor arguments")
  .option(
    "--private-key <private-key>",
    "Private key for deployment (will be prompted securely if not provided). Must include 0x prefix.",
  )
  .action(
    (
      contractPath: string,
      options: {
        endpoint?: string;
        output?: string;
        constructorArgs?: string[];
        privateKey?: string;
      },
    ) => {
      runDeploy(contractPath, options);
    },
  );
