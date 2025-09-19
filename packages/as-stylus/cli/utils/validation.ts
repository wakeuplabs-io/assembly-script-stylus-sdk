/**
 * Enhanced validation utilities with unified error codes
 * Migrated to use the new error code system
 */

import fs from "fs";

import { ErrorCode, createAStylusError } from "./global-error-handler.js";
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
  code?: ErrorCode;
  error?: Error;
  correctedValue?: string;
}

export class ValidationUtils {
  static validatePrivateKey(privateKey: string): ValidationResult {
    if (!privateKey) {
      return {
        isValid: false,
        message: "Private key is required",
        suggestion: "Provide your wallet's private key with the --private-key flag",
        code: ErrorCode.MISSING_PRIVATE_KEY,
        error: createAStylusError(ErrorCode.MISSING_PRIVATE_KEY),
      };
    }

    let keyToValidate = privateKey;
    let wasAutoCorrected = false;

    if (!privateKey.startsWith("0x")) {
      keyToValidate = `0x${privateKey}`;
      wasAutoCorrected = true;
    }

    const keyWithoutPrefix = keyToValidate.slice(2);
    if (keyWithoutPrefix.length !== 64) {
      return {
        isValid: false,
        message: "Private key must be exactly 66 characters long (including 0x prefix)",
        suggestion: "Ensure your private key is a valid 64-character hex string with 0x prefix",
        code: ErrorCode.INVALID_PRIVATE_KEY_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_PRIVATE_KEY_FORMAT),
      };
    }

    if (!/^[0-9a-fA-F]+$/.test(keyWithoutPrefix)) {
      return {
        isValid: false,
        message: "Private key contains invalid characters",
        suggestion: "Private key must contain only hexadecimal characters (0-9, a-f, A-F)",
        code: ErrorCode.INVALID_PRIVATE_KEY_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_PRIVATE_KEY_FORMAT),
      };
    }

    return {
      isValid: true,
      correctedValue: wasAutoCorrected ? keyToValidate : undefined,
      message: wasAutoCorrected ? "Added missing '0x' prefix to private key" : undefined,
    };
  }

  /**
   * Validate RPC URL format and accessibility
   */
  static validateRpcUrl(url: string): ValidationResult {
    if (!url) {
      return {
        isValid: false,
        message: "RPC URL is required",
        suggestion:
          "Provide a valid RPC endpoint: --endpoint https://sepolia-rollup.arbitrum.io/rpc",
        code: ErrorCode.INVALID_RPC_URL,
        error: createAStylusError(ErrorCode.INVALID_RPC_URL),
      };
    }

    try {
      const parsedUrl = new URL(url);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          message: "RPC URL must use HTTP or HTTPS protocol",
          suggestion: "Use a valid HTTP/HTTPS URL: https://sepolia-rollup.arbitrum.io/rpc",
          code: ErrorCode.INVALID_RPC_URL,
          error: createAStylusError(ErrorCode.INVALID_RPC_URL),
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: "Invalid RPC URL format",
        suggestion: "Provide a valid URL format: https://sepolia-rollup.arbitrum.io/rpc",
        code: ErrorCode.INVALID_RPC_URL,
        error: createAStylusError(
          ErrorCode.INVALID_RPC_URL,
          undefined,
          error instanceof Error ? error : undefined,
        ),
      };
    }
  }

  /**
   * Validate contract file exists and is readable
   */
  static validateContractFile(filePath: string): ValidationResult {
    if (!filePath) {
      return {
        isValid: false,
        message: "Contract file path is required",
        suggestion: "Provide the path to your contract file: as-stylus compile contract.ts",
        code: ErrorCode.MISSING_CONTRACT_PATH,
        error: createAStylusError(ErrorCode.MISSING_CONTRACT_PATH),
      };
    }

    if (!filePath.endsWith(".ts")) {
      return {
        isValid: false,
        message: "Contract file must have .ts extension",
        suggestion: "Use a TypeScript file with .ts extension: contract.ts",
        code: ErrorCode.INVALID_CONTRACT_FILE,
        error: createAStylusError(ErrorCode.INVALID_CONTRACT_FILE),
      };
    }

    try {
      if (!fs.existsSync(filePath)) {
        return {
          isValid: false,
          message: `Contract file not found: ${filePath}`,
          suggestion: "Check the file path and ensure the contract file exists",
          code: ErrorCode.INVALID_CONTRACT_FILE,
          error: createAStylusError(ErrorCode.INVALID_CONTRACT_FILE),
        };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return {
          isValid: false,
          message: `Path is not a file: ${filePath}`,
          suggestion: "Provide a path to a valid TypeScript contract file",
          code: ErrorCode.INVALID_CONTRACT_FILE,
          error: createAStylusError(ErrorCode.INVALID_CONTRACT_FILE),
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: `Unable to access contract file: ${filePath}`,
        suggestion: "Check file permissions and path validity",
        code: ErrorCode.FILESYSTEM_ERROR,
        error: createAStylusError(
          ErrorCode.FILESYSTEM_ERROR,
          undefined,
          error instanceof Error ? error : undefined,
        ),
      };
    }
  }

  /**
   * Validate constructor arguments
   */
  static validateConstructorArgs(args: string[]): ValidationResult {
    if (!Array.isArray(args)) {
      return {
        isValid: false,
        message: "Constructor arguments must be an array",
        suggestion: 'Provide constructor arguments as an array: --constructor-args "arg1" "arg2"',
        code: ErrorCode.INVALID_CONSTRUCTOR_ARGS,
        error: createAStylusError(ErrorCode.INVALID_CONSTRUCTOR_ARGS),
      };
    }

    // Check for empty strings which might indicate missing arguments
    const emptyArgs = args.filter((arg) => arg === "");
    if (emptyArgs.length > 0) {
      return {
        isValid: false,
        message: "Constructor arguments cannot be empty strings",
        suggestion: "Provide valid values for all constructor arguments",
        code: ErrorCode.INVALID_CONSTRUCTOR_ARGS,
        error: createAStylusError(ErrorCode.INVALID_CONSTRUCTOR_ARGS),
      };
    }

    return { isValid: true };
  }

  /**
   * Validate project name for generation
   */
  static validateProjectName(name: string): ValidationResult {
    if (!name) {
      return {
        isValid: false,
        message: "Project name is required",
        suggestion: "Provide a project name: as-stylus generate my-token",
        code: ErrorCode.INVALID_PROJECT_NAME,
        error: createAStylusError(ErrorCode.INVALID_PROJECT_NAME),
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return {
        isValid: false,
        message: "Project name contains invalid characters",
        suggestion: "Use only alphanumeric characters, hyphens, and underscores: my-token-project",
        code: ErrorCode.INVALID_PROJECT_NAME,
        error: createAStylusError(ErrorCode.INVALID_PROJECT_NAME),
      };
    }

    if (name.length < 1 || name.length > 50) {
      return {
        isValid: false,
        message: "Project name must be between 1 and 50 characters",
        suggestion: "Choose a shorter, descriptive project name",
        code: ErrorCode.INVALID_PROJECT_NAME,
        error: createAStylusError(ErrorCode.INVALID_PROJECT_NAME),
      };
    }

    return { isValid: true };
  }

  static validateAddress(address: string): ValidationResult {
    if (!address) {
      return {
        isValid: false,
        message: "Address is required",
        suggestion: "Provide a valid Ethereum address",
        code: ErrorCode.INVALID_ADDRESS_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_ADDRESS_FORMAT),
      };
    }

    if (!address.startsWith("0x")) {
      return {
        isValid: false,
        message: "Address must start with '0x'",
        suggestion: `Add '0x' prefix to your address: 0x${address}`,
        code: ErrorCode.INVALID_ADDRESS_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_ADDRESS_FORMAT),
      };
    }

    const addressWithoutPrefix = address.slice(2);
    if (addressWithoutPrefix.length !== 40) {
      return {
        isValid: false,
        message: "Address must be exactly 42 characters long (including 0x prefix)",
        suggestion: "Ensure your address is a valid 40-character hex string with 0x prefix",
        code: ErrorCode.INVALID_ADDRESS_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_ADDRESS_FORMAT),
      };
    }

    if (!/^[0-9a-fA-F]+$/.test(addressWithoutPrefix)) {
      return {
        isValid: false,
        message: "Address contains invalid characters",
        suggestion: "Address must contain only hexadecimal characters (0-9, a-f, A-F)",
        code: ErrorCode.INVALID_ADDRESS_FORMAT,
        error: createAStylusError(ErrorCode.INVALID_ADDRESS_FORMAT),
      };
    }

    return { isValid: true };
  }

  static validateGasLimit(gasLimit: string | number): ValidationResult {
    const numericGasLimit = typeof gasLimit === "string" ? parseInt(gasLimit, 10) : gasLimit;

    if (isNaN(numericGasLimit)) {
      return {
        isValid: false,
        message: "Gas limit must be a valid number",
        suggestion: "Provide a numeric gas limit: --gas-limit 1000000",
        code: ErrorCode.INVALID_GAS_LIMIT,
        error: createAStylusError(ErrorCode.INVALID_GAS_LIMIT),
      };
    }

    if (numericGasLimit < 21000) {
      return {
        isValid: false,
        message: "Gas limit is too low (minimum 21000)",
        suggestion: "Use a higher gas limit: --gas-limit 1000000",
        code: ErrorCode.INVALID_GAS_LIMIT,
        error: createAStylusError(ErrorCode.INVALID_GAS_LIMIT),
      };
    }

    if (numericGasLimit > 30000000) {
      return {
        isValid: false,
        message: "Gas limit is too high (maximum 30,000,000)",
        suggestion: "Use a reasonable gas limit: --gas-limit 5000000",
        code: ErrorCode.INVALID_GAS_LIMIT,
        error: createAStylusError(ErrorCode.INVALID_GAS_LIMIT),
      };
    }

    return { isValid: true };
  }

  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const failed = results.filter((result) => !result.isValid);

    if (failed.length === 0) {
      return { isValid: true };
    }

    const messages = failed.map((result) => result.message).filter(Boolean);
    const suggestions = failed.map((result) => result.suggestion).filter(Boolean);

    // Return the first error code found
    const firstError = failed[0];

    return {
      isValid: false,
      message: messages.join("; "),
      suggestion: suggestions.join("; "),
      code: firstError.code,
      error: firstError.error,
    };
  }

  /**
   * Validate all common deployment parameters at once
   */
  static validateDeploymentParameters(params: {
    contractPath: string;
    privateKey: string;
    endpoint?: string;
    constructorArgs?: string[];
    gasLimit?: string | number;
  }): ValidationResult {
    const results = [
      this.validateContractFile(params.contractPath),
      this.validatePrivateKey(params.privateKey),
    ];

    if (params.endpoint) {
      results.push(this.validateRpcUrl(params.endpoint));
    }

    if (params.constructorArgs) {
      results.push(this.validateConstructorArgs(params.constructorArgs));
    }

    if (params.gasLimit !== undefined) {
      results.push(this.validateGasLimit(params.gasLimit));
    }

    return this.combineValidationResults(results);
  }
}
