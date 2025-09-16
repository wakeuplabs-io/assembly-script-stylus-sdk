/**
 * Unified Error Code System for AS-Stylus SDK
 * HTTP-style 3-digit codes for consistent error handling and debugging
 */

export enum ErrorCode {
  // 1xx: Validation Errors (Input/Parameters)
  INVALID_PRIVATE_KEY_FORMAT = 101,
  MISSING_PRIVATE_KEY = 102,
  INVALID_RPC_URL = 103,
  INVALID_CONTRACT_FILE = 104,
  INVALID_CONSTRUCTOR_ARGS = 105,
  MISSING_CONTRACT_PATH = 106,
  INVALID_PROJECT_NAME = 107,
  INVALID_GAS_LIMIT = 108,
  MISSING_REQUIRED_PARAMETER = 109,
  INVALID_ADDRESS_FORMAT = 110,

  // 2xx: Compilation Errors (TypeScript/AssemblyScript)
  // 201-250: Syntactic Errors
  SYNTAX_ERROR = 201,
  INVALID_SYNTAX = 202,
  MISSING_SEMICOLON = 203,
  INVALID_TOKEN = 204,
  UNEXPECTED_TOKEN = 205,
  MISSING_BRACKET = 206,
  INVALID_EXPRESSION = 207,
  MISSING_DECLARATION = 208,
  INVALID_STATEMENT = 209,
  PARSE_ERROR = 210,

  // 251-299: Semantic Errors
  SEMANTIC_ERROR = 251,
  TYPE_MISMATCH = 252,
  UNDEFINED_VARIABLE = 253,
  UNDEFINED_FUNCTION = 254,
  INVALID_ASSIGNMENT = 255,
  SCOPE_ERROR = 256,
  INHERITANCE_ERROR = 257,
  INTERFACE_ERROR = 258,
  GENERIC_ERROR = 259,
  CONTRACT_VALIDATION_ERROR = 260,

  // 3xx: Deployment/Network Errors
  NETWORK_CONNECTION_FAILED = 301,
  INSUFFICIENT_FUNDS = 302,
  CONTRACT_DEPLOYMENT_FAILED = 303,
  CARGO_STYLUS_ERROR = 304,
  RPC_ENDPOINT_ERROR = 305,
  TRANSACTION_FAILED = 306,
  GAS_ESTIMATION_FAILED = 307,
  NONCE_ERROR = 308,
  CHAIN_ID_MISMATCH = 309,
  CONTRACT_VERIFICATION_FAILED = 310,

  // 4xx: Runtime/Execution Errors
  CONTRACT_EXECUTION_FAILED = 401,
  FUNCTION_NOT_FOUND = 402,
  INVALID_FUNCTION_CALL = 403,
  REVERT_ERROR = 404,
  OUT_OF_GAS = 405,
  STACK_OVERFLOW = 406,
  ASSEMBLY_SCRIPT_ERROR = 407,
  TRANSFORMER_ERROR = 408,
  IR_GENERATION_ERROR = 409,
  HANDLER_ERROR = 410,

  // 5xx: System/Unexpected Errors
  UNKNOWN_ERROR = 501,
  FILESYSTEM_ERROR = 502,
  MEMORY_ERROR = 503,
  TIMEOUT_ERROR = 504,
  INTERNAL_ERROR = 505,
  CONFIGURATION_ERROR = 506,
  DEPENDENCY_ERROR = 507,
  ENVIRONMENT_ERROR = 508,
  PERMISSION_ERROR = 509,
  RESOURCE_EXHAUSTED = 510,
}

/**
 * Error categories for grouping and classification
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  COMPILATION = "compilation",
  DEPLOYMENT = "deployment",
  RUNTIME = "runtime",
  SYSTEM = "system",
}

/**
 * Maps error codes to their categories
 */
export const ERROR_CATEGORIES: Record<number, ErrorCategory> = {
  // Validation (1xx)
  ...Object.fromEntries(
    Object.entries(ErrorCode)
      .filter(([_, code]) => typeof code === "number" && code >= 100 && code < 200)
      .map(([_, code]) => [code, ErrorCategory.VALIDATION]),
  ),

  // Compilation (2xx)
  ...Object.fromEntries(
    Object.entries(ErrorCode)
      .filter(([_, code]) => typeof code === "number" && code >= 200 && code < 300)
      .map(([_, code]) => [code, ErrorCategory.COMPILATION]),
  ),

  // Deployment (3xx)
  ...Object.fromEntries(
    Object.entries(ErrorCode)
      .filter(([_, code]) => typeof code === "number" && code >= 300 && code < 400)
      .map(([_, code]) => [code, ErrorCategory.DEPLOYMENT]),
  ),

  // Runtime (4xx)
  ...Object.fromEntries(
    Object.entries(ErrorCode)
      .filter(([_, code]) => typeof code === "number" && code >= 400 && code < 500)
      .map(([_, code]) => [code, ErrorCategory.RUNTIME]),
  ),

  // System (5xx)
  ...Object.fromEntries(
    Object.entries(ErrorCode)
      .filter(([_, code]) => typeof code === "number" && code >= 500 && code < 600)
      .map(([_, code]) => [code, ErrorCategory.SYSTEM]),
  ),
};

/**
 * Get error category by code
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  return ERROR_CATEGORIES[code] || ErrorCategory.SYSTEM;
}

/**
 * Check if error code is in a specific category
 */
export function isErrorCategory(code: ErrorCode, category: ErrorCategory): boolean {
  return getErrorCategory(code) === category;
}

/**
 * Get all error codes in a category
 */
export function getErrorCodesByCategory(category: ErrorCategory): ErrorCode[] {
  return Object.entries(ERROR_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([code]) => parseInt(code) as ErrorCode);
}
