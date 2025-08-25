/**
 * Validation utilities with actionable error messages
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
}

export class ValidationUtils {
  static validatePrivateKey(privateKey: string): ValidationResult {
    if (!privateKey) {
      return {
        isValid: false,
        message: "Private key is required",
        suggestion: "Provide your wallet's private key with the --private-key flag",
      };
    }

    if (!privateKey.startsWith("0x")) {
      return {
        isValid: false,
        message: "Private key must start with '0x'",
        suggestion: `Add '0x' prefix to your private key: 0x${privateKey}`,
      };
    }

    const keyWithoutPrefix = privateKey.slice(2);
    if (keyWithoutPrefix.length !== 64) {
      return {
        isValid: false,
        message: "Private key must be exactly 64 characters (plus '0x' prefix)",
        suggestion: "Ensure your private key is 66 characters total: '0x' + 64 hex characters",
      };
    }

    if (!/^[0-9a-fA-F]+$/.test(keyWithoutPrefix)) {
      return {
        isValid: false,
        message: "Private key contains invalid characters",
        suggestion:
          "Private key must only contain hexadecimal characters (0-9, a-f, A-F) after '0x'",
      };
    }

    return { isValid: true };
  }

  /**
   * Validates RPC endpoint URL
   */
  static validateRpcUrl(rpcUrl: string): ValidationResult {
    if (!rpcUrl) {
      return {
        isValid: false,
        message: "RPC endpoint is required",
        suggestion:
          "Use the recommended Arbitrum Sepolia RPC: https://sepolia-rollup.arbitrum.io/rpc",
      };
    }

    try {
      const url = new URL(rpcUrl);
      if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
        return {
          isValid: false,
          message: "Invalid RPC URL protocol",
          suggestion: "Use HTTP or HTTPS protocol, e.g., https://sepolia-rollup.arbitrum.io/rpc",
        };
      }
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        message: "Invalid RPC URL format",
        suggestion: "Ensure URL is properly formatted: https://sepolia-rollup.arbitrum.io/rpc",
      };
    }
  }

  static validateConstructorArgs(args: string[]): ValidationResult {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg !== "string") {
        return {
          isValid: false,
          message: `Constructor argument ${i + 1} must be a string`,
          suggestion: `Wrap argument ${i + 1} in quotes: "${arg}"`,
        };
      }
    }
    return { isValid: true };
  }

  static validateContractFile(filePath: string): ValidationResult {
    if (!filePath) {
      return {
        isValid: false,
        message: "Contract file path is required",
        suggestion: "Specify the contract file: npx @wakeuplabs/as-stylus deploy contract.ts ...",
      };
    }

    if (!filePath.endsWith(".ts")) {
      return {
        isValid: false,
        message: "Contract file must have .ts extension",
        suggestion: `Rename your file to have .ts extension: ${filePath.replace(/\.[^/.]+$/, ".ts")}`,
      };
    }

    return { isValid: true };
  }

  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const failures = results.filter((r) => !r.isValid);

    if (failures.length === 0) {
      return { isValid: true };
    }

    return {
      isValid: false,
      message: failures.map((f) => f.message).join("; "),
      suggestion: failures.map((f) => f.suggestion).join("; "),
    };
  }
}
