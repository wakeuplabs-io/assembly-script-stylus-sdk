/**
 * Enhanced error messages with unified codes
 * Migrated from old template system to new unified error handler
 */

import {
  ErrorCode,
  ErrorTemplate,
  ERROR_TEMPLATES,
  createErrorMessage,
} from "./global-error-handler.js";

export { ErrorTemplate } from "./global-error-handler.js";

export const ERROR_TEMPLATES_LEGACY = {
  INVALID_PRIVATE_KEY_FORMAT:
    ERROR_TEMPLATES[ErrorCode.INVALID_PRIVATE_KEY_FORMAT as keyof typeof ERROR_TEMPLATES],
  MISSING_PRIVATE_KEY:
    ERROR_TEMPLATES[ErrorCode.MISSING_PRIVATE_KEY as keyof typeof ERROR_TEMPLATES],
  INVALID_RPC_URL: ERROR_TEMPLATES[ErrorCode.INVALID_RPC_URL as keyof typeof ERROR_TEMPLATES],
  INVALID_CONTRACT_FILE:
    ERROR_TEMPLATES[ErrorCode.INVALID_CONTRACT_FILE as keyof typeof ERROR_TEMPLATES],
  INVALID_CONSTRUCTOR_ARGS:
    ERROR_TEMPLATES[ErrorCode.INVALID_CONSTRUCTOR_ARGS as keyof typeof ERROR_TEMPLATES],
  NETWORK_CONNECTION_FAILED:
    ERROR_TEMPLATES[ErrorCode.NETWORK_CONNECTION_FAILED as keyof typeof ERROR_TEMPLATES],
  INSUFFICIENT_FUNDS: ERROR_TEMPLATES[ErrorCode.INSUFFICIENT_FUNDS as keyof typeof ERROR_TEMPLATES],
  CONTRACT_DEPLOYMENT_FAILED:
    ERROR_TEMPLATES[ErrorCode.CONTRACT_DEPLOYMENT_FAILED as keyof typeof ERROR_TEMPLATES],
  CARGO_STYLUS_ERROR: ERROR_TEMPLATES[ErrorCode.CARGO_STYLUS_ERROR as keyof typeof ERROR_TEMPLATES],
  CONTRACT_EXECUTION_FAILED:
    ERROR_TEMPLATES[ErrorCode.CONTRACT_EXECUTION_FAILED as keyof typeof ERROR_TEMPLATES],
  UNKNOWN_ERROR: ERROR_TEMPLATES[ErrorCode.UNKNOWN_ERROR as keyof typeof ERROR_TEMPLATES],
};

export function findErrorTemplate(errorMessage: string): ErrorTemplate | null {
  const message = errorMessage.toLowerCase();

  // Validation errors (1xx)
  if (message.includes("private key")) {
    if (message.includes("format") || message.includes("0x") || message.includes("66 characters")) {
      return ERROR_TEMPLATES[ErrorCode.INVALID_PRIVATE_KEY_FORMAT as keyof typeof ERROR_TEMPLATES];
    }
    if (message.includes("required") || message.includes("missing")) {
      return ERROR_TEMPLATES[ErrorCode.MISSING_PRIVATE_KEY as keyof typeof ERROR_TEMPLATES];
    }
  }

  if (message.includes("rpc") || message.includes("endpoint")) {
    if (message.includes("invalid") || message.includes("format")) {
      return ERROR_TEMPLATES[ErrorCode.INVALID_RPC_URL as keyof typeof ERROR_TEMPLATES];
    }
    if (message.includes("connection") || message.includes("unreachable")) {
      return ERROR_TEMPLATES[ErrorCode.RPC_ENDPOINT_ERROR as keyof typeof ERROR_TEMPLATES];
    }
  }

  if (message.includes("contract file") || message.includes("file not found")) {
    return ERROR_TEMPLATES[ErrorCode.INVALID_CONTRACT_FILE as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("constructor") && message.includes("arg")) {
    return ERROR_TEMPLATES[ErrorCode.INVALID_CONSTRUCTOR_ARGS as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("address") && message.includes("format")) {
    return ERROR_TEMPLATES[ErrorCode.INVALID_ADDRESS_FORMAT as keyof typeof ERROR_TEMPLATES];
  }

  // Deployment errors (3xx)
  if (message.includes("insufficient funds") || message.includes("balance")) {
    return ERROR_TEMPLATES[ErrorCode.INSUFFICIENT_FUNDS as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("network") || message.includes("connection failed")) {
    return ERROR_TEMPLATES[ErrorCode.NETWORK_CONNECTION_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("cargo stylus")) {
    return ERROR_TEMPLATES[ErrorCode.CARGO_STYLUS_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("deployment") && message.includes("failed")) {
    return ERROR_TEMPLATES[ErrorCode.CONTRACT_DEPLOYMENT_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("transaction failed")) {
    return ERROR_TEMPLATES[ErrorCode.TRANSACTION_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (
    message.includes("max fee per gas") &&
    (message.includes("less than") || message.includes("block base fee"))
  ) {
    return ERROR_TEMPLATES[ErrorCode.GAS_ESTIMATION_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("gas") && (message.includes("estimation") || message.includes("failed"))) {
    return ERROR_TEMPLATES[ErrorCode.GAS_ESTIMATION_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("out of gas")) {
    return ERROR_TEMPLATES[ErrorCode.OUT_OF_GAS as keyof typeof ERROR_TEMPLATES];
  }

  // Runtime errors (4xx)
  if (message.includes("contract") && message.includes("execution")) {
    return ERROR_TEMPLATES[ErrorCode.CONTRACT_EXECUTION_FAILED as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("function not found")) {
    return ERROR_TEMPLATES[ErrorCode.FUNCTION_NOT_FOUND as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("revert")) {
    return ERROR_TEMPLATES[ErrorCode.REVERT_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("stack overflow") || message.includes("maximum call stack")) {
    return ERROR_TEMPLATES[ErrorCode.STACK_OVERFLOW as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("assemblyscript") && message.includes("error")) {
    return ERROR_TEMPLATES[ErrorCode.ASSEMBLY_SCRIPT_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("transformer") && message.includes("error")) {
    return ERROR_TEMPLATES[ErrorCode.TRANSFORMER_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  // Compilation errors (2xx)
  if (message.includes("syntax error") || message.includes("syntactic")) {
    return ERROR_TEMPLATES[ErrorCode.SYNTAX_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("semantic error") || message.includes("semantic")) {
    return ERROR_TEMPLATES[ErrorCode.SEMANTIC_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("type mismatch") || message.includes("type error")) {
    return ERROR_TEMPLATES[ErrorCode.TYPE_MISMATCH as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("undefined variable")) {
    return ERROR_TEMPLATES[ErrorCode.UNDEFINED_VARIABLE as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("undefined function")) {
    return ERROR_TEMPLATES[ErrorCode.UNDEFINED_FUNCTION as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("parse error") || message.includes("parsing")) {
    return ERROR_TEMPLATES[ErrorCode.PARSE_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  // System errors (5xx)
  if (message.includes("enoent") || message.includes("file not found")) {
    return ERROR_TEMPLATES[ErrorCode.FILESYSTEM_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("permission denied") || message.includes("eacces")) {
    return ERROR_TEMPLATES[ErrorCode.PERMISSION_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("timeout") || message.includes("etimedout")) {
    return ERROR_TEMPLATES[ErrorCode.TIMEOUT_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  if (message.includes("memory") || message.includes("enomem")) {
    return ERROR_TEMPLATES[ErrorCode.MEMORY_ERROR as keyof typeof ERROR_TEMPLATES];
  }

  return ERROR_TEMPLATES[ErrorCode.UNKNOWN_ERROR as keyof typeof ERROR_TEMPLATES];
}

export { createErrorMessage };

export function getErrorCodeFromMessage(errorMessage: string): ErrorCode {
  const template = findErrorTemplate(errorMessage);

  if (!template) {
    return ErrorCode.UNKNOWN_ERROR;
  }

  for (const [code, tmpl] of Object.entries(ERROR_TEMPLATES)) {
    if (tmpl === template) {
      return parseInt(code) as ErrorCode;
    }
  }

  return ErrorCode.UNKNOWN_ERROR;
}

export function createErrorMessageWithCode(template: ErrorTemplate, code?: ErrorCode): string {
  const baseMessage = createErrorMessage(template);

  if (code) {
    const COLORS = {
      reset: "\x1b[0m",
      gray: "\x1b[90m",
      bold: "\x1b[1m",
    };

    return `${COLORS.gray}[Error ${code}]${COLORS.reset} ${baseMessage}`;
  }

  return baseMessage;
}

export const ERROR_TEMPLATES_OLD = ERROR_TEMPLATES_LEGACY;
export const findErrorTemplateByMessage = findErrorTemplate;
export const createActionableError = createErrorMessage;
