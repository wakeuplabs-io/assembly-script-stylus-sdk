/**
 * Global Error Handler for AS-Stylus SDK
 * Centralized error handling with unified codes and actionable messages
 */

import { Logger } from "@/cli/services/logger.js";

import { ErrorCode, ErrorCategory, getErrorCategory } from "./error-codes.js";

// Re-export for external usage
export { ErrorCode, ErrorCategory, getErrorCategory } from "./error-codes.js";

export interface ErrorTemplate {
  title: string;
  description: string;
  solution: string;
  moreInfo?: string;
}

export interface AStylusError extends Error {
  code?: ErrorCode;
  category?: ErrorCategory;
  template?: ErrorTemplate;
  originalError?: Error;
}

/**
 * Enhanced error templates with codes and categories
 */
export const ERROR_TEMPLATES: Record<ErrorCode, ErrorTemplate> = {
  // 1xx: Validation Errors
  [ErrorCode.INVALID_PRIVATE_KEY_FORMAT]: {
    title: "Invalid Private Key Format",
    description: "Your private key must start with '0x' and be exactly 66 characters long.",
    solution: "Ensure your private key starts with '0x' and is exactly 66 characters total",
    moreInfo: "Export your private key from MetaMask or your wallet and ensure it starts with 0x",
  },

  [ErrorCode.MISSING_PRIVATE_KEY]: {
    title: "Private Key Required",
    description: "Contract deployment requires a private key to sign the transaction.",
    solution: "Enter your private key when prompted during deployment",
    moreInfo: "Never share your private key or commit it to version control",
  },

  [ErrorCode.INVALID_RPC_URL]: {
    title: "Invalid RPC Endpoint",
    description: "The RPC endpoint URL format is incorrect or unreachable.",
    solution: "Use a valid RPC URL like: --endpoint https://sepolia-rollup.arbitrum.io/rpc",
    moreInfo: "Check that the endpoint is accessible and supports the required network",
  },

  [ErrorCode.INVALID_CONTRACT_FILE]: {
    title: "Invalid Contract File",
    description: "The specified contract file does not exist or is not readable.",
    solution: "Check the file path and ensure the contract file exists: contract.ts",
    moreInfo: "Contract files must have .ts extension and contain valid TypeScript code",
  },

  [ErrorCode.INVALID_CONSTRUCTOR_ARGS]: {
    title: "Invalid Constructor Arguments",
    description:
      "The provided constructor arguments do not match the contract's constructor signature.",
    solution:
      'Check your contract\'s constructor and provide matching arguments: --constructor-args "arg1" "arg2"',
    moreInfo: "Arguments must match the types defined in your contract's constructor",
  },

  [ErrorCode.MISSING_CONTRACT_PATH]: {
    title: "Missing Contract Path",
    description: "No contract file path was specified.",
    solution: "Provide the path to your contract file: as-stylus compile contract.ts",
  },

  [ErrorCode.INVALID_PROJECT_NAME]: {
    title: "Invalid Project Name",
    description: "The project name contains invalid characters or is empty.",
    solution: "Use only alphanumeric characters, hyphens, and underscores: my-token-project",
  },

  [ErrorCode.INVALID_GAS_LIMIT]: {
    title: "Invalid Gas Limit",
    description: "The specified gas limit is invalid or too low.",
    solution: "Use a reasonable gas limit: --gas-limit 1000000",
  },

  [ErrorCode.MISSING_REQUIRED_PARAMETER]: {
    title: "Missing Required Parameter",
    description: "A required parameter was not provided.",
    solution: "Check the command usage and provide all required parameters",
  },

  [ErrorCode.INVALID_ADDRESS_FORMAT]: {
    title: "Invalid Address Format",
    description: "The provided address is not a valid Ethereum address.",
    solution: "Use a valid 40-character hex address starting with 0x",
  },

  // 2xx: Compilation Errors
  [ErrorCode.SYNTAX_ERROR]: {
    title: "Syntax Error",
    description: "The TypeScript code contains syntax errors that prevent compilation.",
    solution: "Fix the syntax errors in your contract code and try again",
    moreInfo: "Check for missing semicolons, brackets, or invalid tokens",
  },

  [ErrorCode.INVALID_SYNTAX]: {
    title: "Invalid Syntax",
    description: "The code contains invalid TypeScript syntax.",
    solution: "Review your code for syntax errors and fix them",
  },

  [ErrorCode.MISSING_SEMICOLON]: {
    title: "Missing Semicolon",
    description: "A semicolon is missing at the end of a statement.",
    solution: "Add the missing semicolon to fix the syntax error",
  },

  [ErrorCode.INVALID_TOKEN]: {
    title: "Invalid Token",
    description: "An invalid token was encountered during parsing.",
    solution: "Check for typos or invalid characters in your code",
  },

  [ErrorCode.UNEXPECTED_TOKEN]: {
    title: "Unexpected Token",
    description: "An unexpected token was found during parsing.",
    solution: "Review the syntax around the error location",
  },

  [ErrorCode.MISSING_BRACKET]: {
    title: "Missing Bracket",
    description: "A closing bracket is missing.",
    solution: "Add the missing closing bracket",
  },

  [ErrorCode.INVALID_EXPRESSION]: {
    title: "Invalid Expression",
    description: "The expression is not valid in this context.",
    solution: "Check the expression syntax and context",
  },

  [ErrorCode.MISSING_DECLARATION]: {
    title: "Missing Declaration",
    description: "A required declaration is missing.",
    solution: "Add the missing variable or function declaration",
  },

  [ErrorCode.INVALID_STATEMENT]: {
    title: "Invalid Statement",
    description: "The statement is not valid in this context.",
    solution: "Check the statement syntax and placement",
  },

  [ErrorCode.PARSE_ERROR]: {
    title: "Parse Error",
    description: "Failed to parse the TypeScript code.",
    solution: "Check for syntax errors in your contract",
  },

  [ErrorCode.SEMANTIC_ERROR]: {
    title: "Semantic Error",
    description: "The code is syntactically correct but semantically invalid.",
    solution: "Fix the semantic issues in your contract code",
  },

  [ErrorCode.TYPE_MISMATCH]: {
    title: "Type Mismatch",
    description: "The types in an expression or assignment don't match.",
    solution: "Ensure type compatibility in your expressions",
  },

  [ErrorCode.UNDEFINED_VARIABLE]: {
    title: "Undefined Variable",
    description: "A variable is used before being declared.",
    solution: "Declare the variable before using it",
  },

  [ErrorCode.UNDEFINED_FUNCTION]: {
    title: "Undefined Function",
    description: "A function is called before being declared or imported.",
    solution: "Declare or import the function before using it",
  },

  [ErrorCode.INVALID_ASSIGNMENT]: {
    title: "Invalid Assignment",
    description: "The assignment is not valid.",
    solution: "Check the assignment syntax and types",
  },

  [ErrorCode.SCOPE_ERROR]: {
    title: "Scope Error",
    description: "A variable or function is accessed outside its scope.",
    solution: "Check variable and function scoping in your code",
  },

  [ErrorCode.INHERITANCE_ERROR]: {
    title: "Inheritance Error",
    description: "There's an error in class inheritance.",
    solution: "Check your class inheritance structure",
  },

  [ErrorCode.INTERFACE_ERROR]: {
    title: "Interface Error",
    description: "Interface implementation is incorrect.",
    solution: "Ensure proper interface implementation",
  },

  [ErrorCode.GENERIC_ERROR]: {
    title: "Generic Error",
    description: "Error in generic type usage.",
    solution: "Check your generic type parameters",
  },

  [ErrorCode.CONTRACT_VALIDATION_ERROR]: {
    title: "Contract Validation Error",
    description: "The contract failed validation checks.",
    solution: "Review your contract structure and decorators",
  },

  // 3xx: Deployment Errors
  [ErrorCode.NETWORK_CONNECTION_FAILED]: {
    title: "Network Connection Failed",
    description: "Unable to connect to the specified RPC endpoint.",
    solution:
      "Check your internet connection and RPC endpoint: --endpoint https://sepolia-rollup.arbitrum.io/rpc",
    moreInfo: "Ensure the RPC endpoint is accessible and the network is reachable",
  },

  [ErrorCode.INSUFFICIENT_FUNDS]: {
    title: "Insufficient Funds",
    description: "The account doesn't have enough ETH to cover gas costs.",
    solution: "Add ETH to your account or use a faucet for testnets",
    moreInfo: "Check your account balance and gas costs on the target network",
  },

  [ErrorCode.CONTRACT_DEPLOYMENT_FAILED]: {
    title: "Contract Deployment Failed",
    description: "The contract deployment transaction failed.",
    solution: "Check gas limits, account balance, and contract code",
    moreInfo: "Review the transaction logs for specific failure reasons",
  },

  [ErrorCode.CARGO_STYLUS_ERROR]: {
    title: "Cargo Stylus Error",
    description: "An error occurred while using cargo stylus.",
    solution: "Check cargo stylus installation and WASM file validity",
    moreInfo: "Ensure cargo stylus is installed and up to date",
  },

  [ErrorCode.RPC_ENDPOINT_ERROR]: {
    title: "RPC Endpoint Error",
    description: "The RPC endpoint returned an error.",
    solution: "Check the RPC endpoint status and your request parameters",
  },

  [ErrorCode.TRANSACTION_FAILED]: {
    title: "Transaction Failed",
    description: "The blockchain transaction failed.",
    solution: "Check transaction parameters and account status",
  },

  [ErrorCode.GAS_ESTIMATION_FAILED]: {
    title: "Gas Estimation Failed",
    description: "Unable to estimate gas for the transaction.",
    solution: "Set a manual gas limit or check contract validity",
  },

  [ErrorCode.NONCE_ERROR]: {
    title: "Nonce Error",
    description: "Transaction nonce is incorrect.",
    solution: "Check account nonce and retry the transaction",
  },

  [ErrorCode.CHAIN_ID_MISMATCH]: {
    title: "Chain ID Mismatch",
    description: "The chain ID doesn't match the target network.",
    solution: "Ensure you're connecting to the correct network",
  },

  [ErrorCode.CONTRACT_VERIFICATION_FAILED]: {
    title: "Contract Verification Failed",
    description: "The deployed contract failed verification.",
    solution: "Check contract code and deployment parameters",
  },

  // 4xx: Runtime Errors
  [ErrorCode.CONTRACT_EXECUTION_FAILED]: {
    title: "Contract Execution Failed",
    description: "The contract function execution failed.",
    solution: "Check function parameters and contract state",
    moreInfo: "Review contract logs and error messages for details",
  },

  [ErrorCode.FUNCTION_NOT_FOUND]: {
    title: "Function Not Found",
    description: "The specified function was not found in the contract.",
    solution: "Check the function name and contract ABI",
  },

  [ErrorCode.INVALID_FUNCTION_CALL]: {
    title: "Invalid Function Call",
    description: "The function call is invalid or malformed.",
    solution: "Check function parameters and call syntax",
  },

  [ErrorCode.REVERT_ERROR]: {
    title: "Contract Reverted",
    description: "The contract execution was reverted.",
    solution: "Check contract conditions and error messages",
  },

  [ErrorCode.OUT_OF_GAS]: {
    title: "Out of Gas",
    description: "The transaction ran out of gas.",
    solution: "Increase the gas limit for complex operations",
  },

  [ErrorCode.STACK_OVERFLOW]: {
    title: "Stack Overflow",
    description: "The execution stack overflowed.",
    solution: "Simplify complex expressions and avoid deep recursion",
  },

  [ErrorCode.ASSEMBLY_SCRIPT_ERROR]: {
    title: "AssemblyScript Error",
    description: "Error in generated AssemblyScript code.",
    solution: "Check the transformed AssemblyScript output",
  },

  [ErrorCode.TRANSFORMER_ERROR]: {
    title: "Transformer Error",
    description: "Error in code transformation process.",
    solution: "Review the intermediate representation and transformers",
  },

  [ErrorCode.IR_GENERATION_ERROR]: {
    title: "IR Generation Error",
    description: "Failed to generate intermediate representation.",
    solution: "Check TypeScript parsing and IR generation",
  },

  [ErrorCode.HANDLER_ERROR]: {
    title: "Handler Error",
    description: "Error in expression handler.",
    solution: "Check handler implementation and expression types",
  },

  // 5xx: System Errors
  [ErrorCode.UNKNOWN_ERROR]: {
    title: "Unknown Error",
    description: "An unexpected error occurred.",
    solution: "Please report this issue with the full error message",
    moreInfo: "This error should be investigated by the development team",
  },

  [ErrorCode.FILESYSTEM_ERROR]: {
    title: "Filesystem Error",
    description: "Unable to read or write files.",
    solution: "Check file permissions and available disk space",
  },

  [ErrorCode.MEMORY_ERROR]: {
    title: "Memory Error",
    description: "Insufficient memory to complete the operation.",
    solution: "Free up system memory or use smaller data sets",
  },

  [ErrorCode.TIMEOUT_ERROR]: {
    title: "Timeout Error",
    description: "The operation timed out.",
    solution: "Try again or increase timeout settings",
  },

  [ErrorCode.INTERNAL_ERROR]: {
    title: "Internal Error",
    description: "An internal error occurred in the SDK.",
    solution: "Please report this issue to the development team",
  },

  [ErrorCode.CONFIGURATION_ERROR]: {
    title: "Configuration Error",
    description: "Invalid configuration detected.",
    solution: "Check your configuration files and settings",
  },

  [ErrorCode.DEPENDENCY_ERROR]: {
    title: "Dependency Error",
    description: "Required dependency is missing or invalid.",
    solution: "Install required dependencies and check versions",
  },

  [ErrorCode.ENVIRONMENT_ERROR]: {
    title: "Environment Error",
    description: "Invalid environment configuration.",
    solution: "Check environment variables and system settings",
  },

  [ErrorCode.PERMISSION_ERROR]: {
    title: "Permission Error",
    description: "Insufficient permissions to perform the operation.",
    solution: "Check file and directory permissions",
  },

  [ErrorCode.RESOURCE_EXHAUSTED]: {
    title: "Resource Exhausted",
    description: "System resources are exhausted.",
    solution: "Free up system resources and try again",
  },
};

/**
 * Create an AS-Stylus error with code and template
 */
export function createAStylusError(
  code: ErrorCode,
  message?: string,
  originalError?: Error,
): AStylusError {
  const template = ERROR_TEMPLATES[code];
  const category = getErrorCategory(code);

  const error: AStylusError = new Error(message || template.description);
  error.code = code;
  error.category = category;
  error.template = template;
  error.originalError = originalError;
  error.name = `AStylusError[${code}]`;

  return error;
}

/**
 * Create error message from template
 */
export function createErrorMessage(template: ErrorTemplate): string {
  const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    bold: "\x1b[1m",
  };

  let message = `\n${COLORS.red}${COLORS.bold}[X] ${template.title}${COLORS.reset}`;
  message += `\n\n${COLORS.gray}Problem:${COLORS.reset}`;
  message += `\n   ${template.description}`;
  message += `\n\n${COLORS.green}Solution:${COLORS.reset}`;
  message += `\n   ${template.solution}`;

  if (template.moreInfo) {
    message += `\n\n${COLORS.cyan}Info:${COLORS.reset}`;
    message += `\n   ${template.moreInfo}`;
  }
  message += "\n";

  return message;
}

/**
 * Handle unknown errors and map them to system errors
 */
export function handleUnknownError(error: unknown): AStylusError {
  if (error instanceof Error && "code" in error && typeof error.code === "number") {
    return error as AStylusError;
  }

  if (error instanceof Error) {
    if (error.message.includes("ENOENT") || error.message.includes("file not found")) {
      return createAStylusError(ErrorCode.FILESYSTEM_ERROR, error.message, error);
    }
    if (error.message.includes("permission denied") || error.message.includes("EACCES")) {
      return createAStylusError(ErrorCode.PERMISSION_ERROR, error.message, error);
    }
    if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
      return createAStylusError(ErrorCode.TIMEOUT_ERROR, error.message, error);
    }
    if (error.message.includes("memory") || error.message.includes("ENOMEM")) {
      return createAStylusError(ErrorCode.MEMORY_ERROR, error.message, error);
    }

    // Generic unknown error
    return createAStylusError(ErrorCode.UNKNOWN_ERROR, error.message, error);
  }

  const message = typeof error === "string" ? error : String(error);
  return createAStylusError(ErrorCode.UNKNOWN_ERROR, message);
}

/**
 * Global error handler function
 */
export function handleGlobalError(error: unknown): never {
  const astylusError = handleUnknownError(error);
  const logger = Logger.getInstance();

  if (astylusError.template) {
    const errorMessage = createErrorMessage(astylusError.template);
    logger.error(`[${astylusError.code}] ${errorMessage}`);
  } else {
    logger.error(`[${astylusError.code}] ${astylusError.message}`);
  }

  if (astylusError.originalError && astylusError.originalError.stack) {
    logger.debug(`Original error stack: ${astylusError.originalError.stack}`);
  }

  process.exit(1);
}

/**
 * Find error template by message pattern (for backward compatibility)
 */
export function findErrorTemplate(errorMessage: string): ErrorTemplate | null {
  const message = errorMessage.toLowerCase();

  if (message.includes("private key") && (message.includes("format") || message.includes("0x"))) {
    return ERROR_TEMPLATES[ErrorCode.INVALID_PRIVATE_KEY_FORMAT];
  }
  if (message.includes("private key") && message.includes("required")) {
    return ERROR_TEMPLATES[ErrorCode.MISSING_PRIVATE_KEY];
  }
  if (message.includes("rpc") || message.includes("endpoint")) {
    return ERROR_TEMPLATES[ErrorCode.INVALID_RPC_URL];
  }
  if (message.includes("insufficient funds") || message.includes("balance")) {
    return ERROR_TEMPLATES[ErrorCode.INSUFFICIENT_FUNDS];
  }
  if (message.includes("network") || message.includes("connection")) {
    return ERROR_TEMPLATES[ErrorCode.NETWORK_CONNECTION_FAILED];
  }
  if (message.includes("cargo stylus")) {
    return ERROR_TEMPLATES[ErrorCode.CARGO_STYLUS_ERROR];
  }

  return null;
}
