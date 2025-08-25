/**
 * Centralized actionable error messages for common CLI issues
 */

export interface ErrorTemplate {
  title: string;
  description: string;
  solution: string;
  moreInfo?: string;
}

export const ERROR_TEMPLATES = {
  INVALID_PRIVATE_KEY_FORMAT: {
    title: "Invalid Private Key Format",
    description: "Your private key must start with '0x' and be exactly 66 characters long.",
    solution: "Add '0x' prefix to your private key: --private-key 0xYOUR_KEY_HERE",
    moreInfo: "Export your private key from MetaMask or your wallet and ensure it starts with 0x",
  },

  MISSING_PRIVATE_KEY: {
    title: "Private Key Required",
    description: "Contract deployment requires a private key to sign the transaction.",
    solution: "Add your private key: --private-key 0xYOUR_PRIVATE_KEY_HERE",
    moreInfo: "Never share your private key or commit it to version control",
  },

  INVALID_RPC_URL: {
    title: "Invalid RPC Endpoint",
    description: "The RPC endpoint URL format is incorrect or unreachable.",
    solution:
      "Use the recommended Arbitrum Sepolia RPC: --endpoint https://sepolia-rollup.arbitrum.io/rpc",
    moreInfo: "You can also try other public Arbitrum Sepolia endpoints from chainlist.org",
  },

  RPC_CONNECTION_FAILED: {
    title: "RPC Connection Failed",
    description: "Unable to connect to the RPC endpoint.",
    solution:
      "Check your internet connection and try the recommended RPC: https://sepolia-rollup.arbitrum.io/rpc",
    moreInfo: "If the issue persists, the RPC endpoint might be experiencing downtime",
  },

  INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "Your wallet doesn't have enough ETH to pay for gas fees.",
    solution: "Get Arbitrum Sepolia ETH from a faucet: https://faucets.chain.link/arbitrum-sepolia",
    moreInfo: "You need ETH to pay for deployment gas fees on Arbitrum Sepolia testnet",
  },

  CONTRACT_SIZE_TOO_LARGE: {
    title: "Contract Size Exceeds Limit",
    description: "Your compiled contract is too large to deploy.",
    solution:
      "Optimize your contract by removing unused functions or splitting into multiple contracts",
    moreInfo:
      "Arbitrum has contract size limits. Consider using libraries or proxy patterns for large contracts",
  },

  INVALID_CONSTRUCTOR_ARGS: {
    title: "Invalid Constructor Arguments",
    description: "The constructor arguments don't match what your contract expects.",
    solution:
      'Check your contract constructor and provide matching arguments: --constructor-args "arg1" "arg2"',
    moreInfo: "Make sure argument count and types match your contract's constructor exactly",
  },

  COMPILATION_FAILED: {
    title: "Contract Compilation Failed",
    description: "There are syntax errors or type issues in your TypeScript contract.",
    solution: "Fix the compilation errors in your contract.ts file and try again",
    moreInfo: "Check the error details above for specific lines and issues to fix",
  },

  MISSING_CONTRACT_FILE: {
    title: "Contract File Not Found",
    description: "The specified contract file doesn't exist.",
    solution: "Ensure your contract file exists: ls contract.ts",
    moreInfo: "Make sure you're in the correct directory and the file name is spelled correctly",
  },

  GAS_ESTIMATION_FAILED: {
    title: "Gas Estimation Failed",
    description: "Unable to estimate gas for the transaction.",
    solution: "Check your contract logic and constructor arguments, then retry deployment",
    moreInfo: "This often happens when constructor arguments are invalid or contract logic reverts",
  },

  TRANSACTION_REVERTED: {
    title: "Transaction Reverted",
    description: "The deployment transaction was reverted by the network.",
    solution:
      "Check constructor logic and arguments. Ensure your contract doesn't revert during deployment",
    moreInfo: "Review your contract's constructor and any initialization code for potential issues",
  },

  CARGO_STYLUS_NOT_FOUND: {
    title: "cargo-stylus Not Installed",
    description: "The cargo-stylus tool is required but not found in your system.",
    solution: "Install cargo-stylus: cargo install cargo-stylus",
    moreInfo: "Make sure you have Rust installed and cargo is in your PATH",
  },

  RUST_VERSION_TOO_OLD: {
    title: "Rust Version Too Old",
    description: "cargo-stylus requires Rust 1.81 or newer.",
    solution: "Update Rust: rustup update && rustup default stable",
    moreInfo: "Check your Rust version with: rustc --version",
  },

  WASM_TARGET_MISSING: {
    title: "WebAssembly Target Missing",
    description: "The wasm32-unknown-unknown target is required for Stylus contracts.",
    solution: "Add the WASM target: rustup target add wasm32-unknown-unknown",
    moreInfo: "This target is required to compile contracts to WebAssembly",
  },
};

export const CARGO_ERROR_PATTERNS = [
  {
    pattern: /private key must be a 0x-prefixed/i,
    template: ERROR_TEMPLATES.INVALID_PRIVATE_KEY_FORMAT,
  },
  {
    pattern: /insufficient funds/i,
    template: ERROR_TEMPLATES.INSUFFICIENT_FUNDS,
  },
  {
    pattern: /connection refused|network unreachable/i,
    template: ERROR_TEMPLATES.RPC_CONNECTION_FAILED,
  },
  {
    pattern: /contract creation code size exceeds/i,
    template: ERROR_TEMPLATES.CONTRACT_SIZE_TOO_LARGE,
  },
  {
    pattern: /execution reverted|transaction reverted/i,
    template: ERROR_TEMPLATES.TRANSACTION_REVERTED,
  },
  {
    pattern: /gas estimation failed/i,
    template: ERROR_TEMPLATES.GAS_ESTIMATION_FAILED,
  },
  {
    pattern: /cargo-stylus.*not found/i,
    template: ERROR_TEMPLATES.CARGO_STYLUS_NOT_FOUND,
  },
  {
    pattern: /requires rust.*1\.8[1-9]|requires rust.*1\.[9-9]/i,
    template: ERROR_TEMPLATES.RUST_VERSION_TOO_OLD,
  },
  {
    pattern: /wasm32-unknown-unknown.*not installed/i,
    template: ERROR_TEMPLATES.WASM_TARGET_MISSING,
  },
];

export function findErrorTemplate(errorMessage: string): ErrorTemplate | null {
  const pattern = CARGO_ERROR_PATTERNS.find((p) => p.pattern.test(errorMessage));

  return pattern ? pattern.template : null;
}

export function formatActionableError(
  title: string,
  description: string,
  solution: string,
  moreInfo?: string,
): string {
  let formatted = `\n❌ ${title}\n`;
  formatted += `\n📝 ${description}\n`;
  formatted += `\n💡 Solution: ${solution}\n`;

  if (moreInfo) {
    formatted += `\nℹ️  ${moreInfo}\n`;
  }

  return formatted;
}

export function createErrorMessage(template: ErrorTemplate): string {
  return formatActionableError(
    template.title,
    template.description,
    template.solution,
    template.moreInfo,
  );
}
