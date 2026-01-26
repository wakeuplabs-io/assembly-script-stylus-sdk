# Testing Contracts

Writing comprehensive tests is crucial for ensuring your AssemblyScript Stylus contracts behave correctly. This guide walks you through testing your contracts using the AssemblyScript Stylus SDK's testing framework.

The SDK provides a streamlined testing experience built on [viem](https://viem.sh/) for blockchain interactions and [Jest](https://jestjs.io/) as the test runner. You'll learn how to deploy contracts, interact with them, test error conditions, and work with multiple accounts—all with utilities designed specifically for AssemblyScript Stylus development.

## Prerequisites

Before writing tests, ensure you have:

- A compiled AssemblyScript Stylus contract (with generated ABI)
- Jest installed and configured in your project
- Environment variables configured for your test environment

Projects initialized with `npx @wakeuplabs/as-stylus generate` come with a pre-configured test setup. If you're setting up manually, you'll need a configuration file.

### Test Configuration

Your test configuration manages RPC endpoints, deployment settings, and project paths. Create a `config.ts` file in your tests directory:

```typescript

import { config as loadConfig } from "dotenv";
import { Hex } from "viem";
import path from "path";

loadConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const DEPLOY_TIMEOUT = Number(process.env.DEPLOY_TIMEOUT) as number;
const RPC_URL = process.env.RPC_URL as string;
const DEFAULT_ROOT = path.resolve(__dirname, "../..") as string;

export const config = {
  privateKey: PRIVATE_KEY,
  deployTimeout: DEPLOY_TIMEOUT,
  rpcUrl: RPC_URL,
  projectRoot: DEFAULT_ROOT,
};
```

## Your First Test

Let's build a test suite for a `Counter` contract step by step. The SDK handles contract deployment, compilation, and interaction, so you can focus on writing test logic.

### Setting Up the Test Environment

Start by importing the SDK utilities and configuring your test environment:

```typescript
import { WalletClient } from "viem";
import {
  contractService,
  ChainId,
  getPublicClient,
  getWalletClient,
  setup,
  getTestAccount,
  TESTS_ACCOUNTS_NAME,
} from "@wakeuplabs/as-stylus";
import path from "path";
import { config } from "../config.js";
```

### Configuring Clients and Accounts

The SDK uses separate clients for reading and writing operations. Set them up at the module level:

```typescript
// Get a pre-configured test account
const deployer = getTestAccount(TESTS_ACCOUNTS_NAME.Deployer);

// Public client for read operations (no signing needed)
const publicClient = getPublicClient(ChainId.LocalArbitrumSepolia, config.rpcUrl);

// Wallet client for write operations (requires private key for signing)
const walletClient: WalletClient = getWalletClient(
  ChainId.LocalArbitrumSepolia,
  deployer.privateKey,
  config.rpcUrl,
);
```

### Defining Contract Paths

Point to your contract source and generated ABI:

```typescript
const CONTRACT_PATHS = {
  COUNTER: {
    constructorName: "counter_constructor",
    contract: path.join(config.projectRoot, "src/contracts/counter.ts"),
    abi: path.join(config.projectRoot, "/artifacts/abi/counter-abi.json"),
  },
};
```

### Deploying the Contract

Use `beforeAll` to deploy once before all tests run. The `setup` function handles compilation, deployment, and returns a contract service:

```typescript
let contract: ReturnType<typeof contractService>;

beforeAll(async () => {
  try {
    contract = await setup(
      publicClient,
      CONTRACT_PATHS.COUNTER.contract,
      CONTRACT_PATHS.COUNTER.abi,
      {
        endpoint: config.rpcUrl,
        privateKey: config.privateKey,
        constructorName: CONTRACT_PATHS.COUNTER.constructorName,
        deployArgs: [],
        walletClient,
        verbose: true,
        root: config.projectRoot,
      },
    );
  } catch (error: unknown) {
    console.error(error);
    throw new Error(`Contract deployment failed: ${error}`);
  }
}, config.deployTimeout);
```

### Writing Your First Assertions

Now you can write tests that interact with your deployed contract:

```typescript
describe("Counter Contract Tests", () => {
  it("should deploy successfully", async () => {
    expect(contract.address).toBeDefined();
  });

  it("should initialize with zero", async () => {
    const result = await contract.read("get", []);
    expect(result).toBe(0n);
  });
});
```

## Interacting with Your Contract

The SDK provides two methods for contract interaction: `read` for view functions and `write` for state-changing operations.

### Reading Contract State

View functions don't modify state and don't require gas. Use `contract.read()` to call them:

```typescript
it("should return the current counter value", async () => {
  const result = await contract.read("get", []);
  expect(result).toBe(0n);
});
```

The method signature is `contract.read(functionName, args[])`. For functions without parameters, pass an empty array.

### Modifying Contract State

State-changing functions require a transaction and must be signed. Use `contract.write()` with a wallet client:

```typescript
it("should increment the counter", async () => {
  await contract.write(walletClient, "increment", []);
  const counter = await contract.read("get", []);
  expect(counter).toBe(1n);
});
```

The `write` method automatically handles transaction signing, submission, and waiting for confirmation. Always pass the `walletClient` as the first argument.

## Testing Error Conditions

Your contracts should properly handle error cases. The SDK provides utilities to test both read and write operations that should revert.

### Testing Write Reverts

When a state-changing function should fail, use `expectRevertWrite`. It returns decoded error information:

```typescript
import { expectRevertWrite } from "@wakeuplabs/as-stylus";

it("should revert with CounterZero error when decrementing from zero", async () => {
  const result = await expectRevertWrite(contract, walletClient, "decrement", []);
  
  // The result contains the decoded error name and arguments
  expect(result.errorName).toBe("CounterZero");
  expect(result.args).toEqual([]);
});
```

This utility automatically catches the revert and decodes custom errors defined in your AssemblyScript contract.

### Testing Read Reverts

For view functions that should revert, use `expectRevert`:

```typescript
import { expectRevert } from "@wakeuplabs/as-stylus";

it("should revert when accessing invalid data", async () => {
  const result = await expectRevert(contract, "getInvalidItem", [0n]);
  expect(result.errorName).toBe("ItemNotFound");
  expect(result.args).toEqual([0n]);
});
```

Both utilities provide structured error information, making it easy to assert on specific error types and their arguments.

## Testing with Multiple Accounts

Many contracts implement access control or multi-user functionality. The SDK provides pre-configured test accounts that are automatically funded on local networks.

### Setting Up Multiple Accounts

Create wallet clients for different accounts to test various scenarios:

```typescript
// Get different test accounts
const deployer = getTestAccount(TESTS_ACCOUNTS_NAME.Deployer);
const alice = getTestAccount(TESTS_ACCOUNTS_NAME.Alice);
const bob = getTestAccount(TESTS_ACCOUNTS_NAME.Bob);

// Create wallet clients for each account
const deployerWallet = getWalletClient(
  ChainId.LocalArbitrumSepolia,
  deployer.privateKey,
  config.rpcUrl,
);

const aliceWallet = getWalletClient(
  ChainId.LocalArbitrumSepolia,
  alice.privateKey,
  config.rpcUrl,
);
```

### Testing Access Control

Use different accounts to verify access restrictions:

```typescript
it("should enforce owner-only access", async () => {
  // Owner can call the function
  await contract.write(deployerWallet, "ownerOnlyFunction", []);

  // Non-owner should be rejected
  const result = await expectRevertWrite(
    contract, 
    aliceWallet, 
    "ownerOnlyFunction", 
    []
  );
  expect(result.errorName).toBe("OwnableUnauthorizedAccount");
});
```

This pattern is essential for testing ownership, roles, and permission systems in your contracts.

## Putting It All Together

Here's a complete test suite that demonstrates all the concepts covered:

```typescript
import { WalletClient } from "viem";
import {
  contractService,
  ChainId,
  expectRevertWrite,
  getPublicClient,
  getWalletClient,
  setup,
  getTestAccount,
  TESTS_ACCOUNTS_NAME,
} from "@wakeuplabs/as-stylus";
import path from "path";
import { config } from "../config.js";

const deployer = getTestAccount(TESTS_ACCOUNTS_NAME.Deployer);
let contract: ReturnType<typeof contractService>;
const publicClient = getPublicClient(ChainId.LocalArbitrumSepolia, config.rpcUrl);
const walletClient: WalletClient = getWalletClient(
  ChainId.LocalArbitrumSepolia,
  deployer.privateKey,
  config.rpcUrl,
);

const CONTRACT_PATHS = {
  COUNTER: {
    constructorName: "counter_constructor",
    contract: path.join(config.projectRoot, "src/contracts/counter.ts"),
    abi: path.join(config.projectRoot, "/artifacts/abi/counter-abi.json"),
  },
};

beforeAll(async () => {
  try {
    contract = await setup(
      publicClient,
      CONTRACT_PATHS.COUNTER.contract,
      CONTRACT_PATHS.COUNTER.abi,
      {
        endpoint: config.rpcUrl,
        privateKey: config.privateKey,
        constructorName: CONTRACT_PATHS.COUNTER.constructorName,
        deployArgs: [],
        walletClient,
        verbose: true,
        root: config.projectRoot,
      },
    );
  } catch (error: unknown) {
    console.error(error);
    throw new Error(`Contract deployment failed: ${error}`);
  }
}, config.deployTimeout);

describe("Counter Contract Tests", () => {
  describe("deployment", () => {
    it("should deploy the contract", async () => {
      expect(contract.address).toBeDefined();
    });

    it("should have initial counter at zero", async () => {
      const result = await contract.read("get", []);
      expect(result).toBe(0n);
    });
  });

  describe("operations", () => {
    it("should increment the counter", async () => {
      await contract.write(walletClient, "increment", []);
      const counter = await contract.read("get", []);
      expect(counter).toBe(1n);
    });

    it("should decrement the counter", async () => {
      await contract.write(walletClient, "decrement", []);
      const counter = await contract.read("get", []);
      expect(counter).toBe(0n);
    });

    it("should revert when decrementing zero", async () => {
      const result = await expectRevertWrite(contract, walletClient, "decrement", []);
      expect(result.errorName).toBe("CounterZero");
      expect(result.args).toEqual([]);
    });
  });
});
```

## Running Your Test Suite

Execute your tests using Jest's command-line interface:

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm test -- --watchAll=false

# Run with detailed output
npm test -- --verbose

# Run a specific test file
npm test -- src/tests/counter/counter.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should increment"
```

The SDK's test utilities work seamlessly with Jest's features like test filtering, coverage reports, and parallel execution.

## API Reference

### Core Testing Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `setup(publicClient, contractPath, abiPath, options)` | Compiles and deploys a contract, returning a contract service | `ContractService` |
| `contract.read(functionName, args)` | Calls a view function (no gas, no state change) | `Promise<any>` |
| `contract.write(walletClient, functionName, args)` | Executes a state-changing function (requires gas, signs transaction) | `Promise<void>` |
| `expectRevert(contract, functionName, args)` | Asserts a read call reverts and returns decoded error | `Promise<DecodedError>` |
| `expectRevertWrite(contract, walletClient, functionName, args)` | Asserts a write call reverts and returns decoded error | `Promise<DecodedError>` |

### Client Utilities

| Function | Purpose |
|----------|---------|
| `getPublicClient(chainId, rpcUrl)` | Creates a viem public client for read operations |
| `getWalletClient(chainId, privateKey, rpcUrl)` | Creates a viem wallet client for write operations |
| `getTestAccount(accountName)` | Retrieves a pre-configured test account with private key |

### Pre-configured Test Accounts

The SDK includes several test accounts ready to use:

- **`TESTS_ACCOUNTS_NAME.Deployer`** - Primary account for contract deployment
- **`TESTS_ACCOUNTS_NAME.Alice`** - Secondary test account
- **`TESTS_ACCOUNTS_NAME.Bob`** - Tertiary test account

These accounts are automatically funded with test ETH on local Arbitrum networks, making them perfect for testing multi-user scenarios without manual account setup.

## Next Steps

Now that you understand the basics of testing, consider:

- Testing complex state transitions
- Verifying event emissions
- Testing gas optimization scenarios
- Setting up test fixtures for reusable contract deployments
- Integrating with CI/CD pipelines

For more advanced testing patterns, check out the examples in the SDK repository.
