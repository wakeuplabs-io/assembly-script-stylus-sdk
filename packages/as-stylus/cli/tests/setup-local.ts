import { Address, PublicClient, WalletClient } from "viem";

import { getPublicClient, getWalletClient } from "./clients.js";
import { contractService } from "./contract-service.js";
import { LocalNodeManager, LocalNodeConfig } from "./local-node-manager.js";
import { run, parseDeploymentOutput } from "./system-helpers.js";
import { getTestAccount, TESTS_ACCOUNTS_NAME } from "./test-accounts.js";
import { ChainId, ContractArgs } from "./types.js";
import { getAbi } from "./utils.js";

// Default test private key (same as used in tests)
const DEFAULT_TEST_PRIVATE_KEY = getTestAccount(TESTS_ACCOUNTS_NAME.Deployer).privateKey;

/**
 * Deploys contract directly using cargo stylus (non-interactive)
 * @param contractPath Path to the contract
 * @param privateKey Private key to use
 * @param endpoint RPC endpoint
 * @param contractName Name of the contract file (without .ts extension)
 * @returns Deploy command output
 */
function deployContract(
  contractPath: string,
  privateKey: string,
  endpoint: string,
  root: string,
): string {
  const contractName = contractPath.split("/").pop()?.replace(/\.ts$/, "");
  const wasmPath = `${root}/artifacts/build/${contractName}.wasm`;
  const command = `cargo stylus deploy --wasm-file ${wasmPath} --private-key ${privateKey} --endpoint ${endpoint} --no-verify`;

  const deploymentOutput = run(command, root);

  return deploymentOutput;
}

/**
 * Creates and funds additional test wallet clients for multi-account testing
 * @param testAccounts Array of test account names to create
 * @param verbose Whether to log progress
 * @param walletClient Deployer wallet client used to fund test accounts
 * @param endpoint RPC endpoint
 * @returns Array of funded test wallet clients
 */
async function createTestWallets(
  testAccounts: TESTS_ACCOUNTS_NAME[],
  verbose: boolean,
  walletClient: WalletClient,
  endpoint: string,
): Promise<WalletClient[]> {
  const testWallets: WalletClient[] = [];

  if (verbose) {
    console.log(`💰 Funding ${testAccounts.length} test account(s)...`);
  }

  for (const accountName of testAccounts) {
    // Get account from enum
    const namedAccount = getTestAccount(accountName);
    const testPrivateKey = namedAccount.privateKey;
    const testAddress = namedAccount.address;

    // Fund the test account from deployer (send 100 ETH)
    const fundingAmount = BigInt("100000000000000000000"); // 100 ETH in wei

    try {
      const hash = await walletClient.sendTransaction({
        account: walletClient.account!,
        chain: null,
        to: testAddress,
        value: fundingAmount,
      });
      if (verbose) {
        console.log(
          `   ✓ Funded ${testAddress.slice(0, 10)}... with 100 ETH (tx: ${hash.slice(0, 10)}...)`,
        );
      }
    } catch (error) {
      console.warn(
        `   ⚠️  Failed to fund ${testAddress}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const testWallet = getWalletClient(ChainId.LocalArbitrumSepolia, testPrivateKey, endpoint);
    testWallets.push(testWallet);
  }

  if (verbose) {
    console.log(`✅ Created ${testWallets.length} funded test wallet(s)`);
  }

  return testWallets;
}

export interface SetupLocalOptions {
  contractPath: string;
  abiPath: string;
  constructorName: string;
  deployArgs?: ContractArgs;
  verbose?: boolean;
  root: string;
  privateKey?: string;
  nodeConfig?: LocalNodeConfig;
  /**
   * Additional test accounts to create wallet clients for
   * Use account names from TESTS_ACCOUNTS_NAME enum
   *
   * Example:
   * ```typescript
   * import { TESTS_ACCOUNTS_NAME } from "@wakeuplabs/as-stylus";
   *
   * testAccounts: [TESTS_ACCOUNTS_NAME.Alice, TESTS_ACCOUNTS_NAME.Bob]
   * ```
   */
  testAccounts?: TESTS_ACCOUNTS_NAME[];
}

export interface SetupLocalResult {
  contract: ReturnType<typeof contractService>;
  nodeManager: LocalNodeManager;
  publicClient: PublicClient;
  walletClient: WalletClient;
  /**
   * Additional wallet clients for testing multi-account scenarios
   * Indexed in the same order as testAccounts option
   */
  testWallets: WalletClient[];
  cleanup: () => Promise<void>;
}

/**
 * Complete setup for local e2e tests: starts local Nitro node, builds, deploys,
 * and initializes contract with constructor execution.
 *
 * @requires Docker must be installed and running on the system
 * @throws {Error} If Docker is not available or node fails to start
 *
 * This function automatically:
 * 1. Starts a local Nitro devnet (using Docker if available)
 * 2. Compiles the contract
 * 3. Deploys to the local node
 * 4. Executes the constructor
 * 5. Returns contract service + cleanup function
 *
 * Usage:
 * ```typescript
 * const { contract, walletClient, cleanup } = await setupLocal({
 *   contractPath: path.join(__dirname, '../contracts/counter.ts'),
 *   abiPath: path.join(__dirname, '../artifacts/abi/counter-abi.json'),
 *   constructorName: 'counter_constructor',
 *   deployArgs: [],
 *   root: __dirname,
 *   verbose: true, // Optional: show SDK logs (compile, deploy, etc)
 *   // nodeConfig: { dockerVerbose: true }, // Optional: show Docker/Nitro logs
 * });
 *
 * try {
 *   // Run your tests
 *   await contract.write(walletClient, 'increment', []);
 *   const count = await contract.read('get', []);
 *   expect(count).toBe(1n);
 * } finally {
 *   // Always cleanup
 *   await cleanup();
 * }
 * ```
 *
 * @param options Configuration options
 * @returns Contract service, node manager, clients, and cleanup function
 */
export async function setupLocal(options: SetupLocalOptions): Promise<SetupLocalResult> {
  const privateKey = options.privateKey || DEFAULT_TEST_PRIVATE_KEY;
  const verbose = options.verbose ?? false;

  // Create and start local node
  const nodeManager = new LocalNodeManager({
    verbose,
    ...options.nodeConfig,
  });

  try {
    await nodeManager.start();
  } catch (error) {
    throw new Error(
      `Failed to start local node: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const endpoint = nodeManager.getRpcUrl();

  // Create clients
  const publicClient = getPublicClient(ChainId.LocalArbitrumSepolia, endpoint);
  const walletClient = getWalletClient(ChainId.LocalArbitrumSepolia, privateKey, endpoint);

  // Create additional test wallet clients if requested
  const testWallets: WalletClient[] =
    options.testAccounts && options.testAccounts.length > 0
      ? await createTestWallets(options.testAccounts, verbose, walletClient, endpoint)
      : [];

  try {
    // Compile contract
    if (verbose) {
      console.log("🔨 Compiling contract...");
    }
    run(
      `npx @wakeuplabs/as-stylus compile ${options.contractPath} --endpoint ${endpoint}`,
      options.root,
    );

    // Get ABI
    const abi = getAbi(options.abiPath);

    // Deploy contract
    if (verbose) {
      console.log("🚀 Deploying contract to local node...");
    }
    const deployLog = deployContract(options.contractPath, privateKey, endpoint, options.root);
    const contractAddr = parseDeploymentOutput(deployLog);

    if (verbose) {
      console.log("📍 Contract deployed at:", contractAddr);
    }

    // Create contract service
    const contract = contractService(publicClient, contractAddr as Address, abi, false);

    // Execute constructor if exists
    const constructor = abi.find(
      (method: { name: string }) => method.name === options.constructorName,
    );

    if (constructor) {
      const constructorArgs = options.deployArgs || [];
      if (verbose) {
        console.log("🔧 Executing constructor with args:", constructorArgs);
        console.log("🔍 Found constructor:", constructor.name);
      }

      await contract.write(walletClient, constructor.name, constructorArgs);

      if (verbose) {
        console.log("✅ Constructor executed successfully");
      }
    } else if (verbose) {
      console.log("ℹ️  No constructor defined in contract - skipping constructor call");
    }

    // Create cleanup function
    const cleanup = async () => {
      await nodeManager.stop();
    };

    return {
      contract,
      nodeManager,
      publicClient,
      walletClient,
      testWallets,
      cleanup,
    };
  } catch (error) {
    // If anything fails, make sure to stop the node
    await nodeManager.stop();
    throw error;
  }
}

/**
 * Helper to use setupLocal in Jest tests with automatic cleanup
 *
 * Usage in tests:
 * ```typescript
 * describe('Counter Tests', () => {
 *   let testEnv: SetupLocalResult;
 *
 *   beforeAll(async () => {
 *     testEnv = await setupLocal({ ... });
 *   });
 *
 *   afterAll(async () => {
 *     await testEnv.cleanup();
 *   });
 *
 *   it('should increment', async () => {
 *     await testEnv.contract.write(testEnv.walletClient, 'increment', []);
 *     const count = await testEnv.contract.read('get', []);
 *     expect(count).toBe(1n);
 *   });
 * });
 * ```
 */
