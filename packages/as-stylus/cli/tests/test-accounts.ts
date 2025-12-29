/**
 * Pre-funded test accounts for Nitro testnode
 *
 * These accounts are derived from Hardhat's default test mnemonic:
 * "test test test test test test test test test test test junk"
 *
 * The first account (funnel/deployer) is funded with the most ETH
 * and is typically used as the deployer account.
 *
 * WARNING: These are PUBLIC test keys. NEVER use them on mainnet or with real funds.
 *
 * @see https://docs.arbitrum.io/run-arbitrum-node/run-nitro-dev-node
 * @see https://github.com/OffchainLabs/nitro-devnode
 */

export enum TESTS_ACCOUNTS_NAME {
  Deployer = "Deployer",
  Alice = "Alice",
  Bob = "Bob",
  Charlie = "Charlie",
}

export interface TestAccount {
  /**
   * Human-readable name for the account
   */
  name: string;
  /**
   * Ethereum address (checksummed)
   */
  address: `0x${string}`;
  /**
   * Private key (hex string with 0x prefix)
   */
  privateKey: `0x${string}`;
  /**
   * Description of the account's typical use case
   */
  description: string;
}

/**
 * Nitro testnode pre-funded test accounts
 *
 * All accounts are pre-funded with test ETH on the local Nitro node.
 * Account 0 (funnel) has the most ETH and is typically used as the deployer.
 */
export const NITRO_TEST_ACCOUNTS = {
  /**
   * Account 0 - Primary deployer account
   * Also known as "funnel" in nitro-testnode
   *
   * This account has the most test ETH and is used by default in setupLocal()
   */
  deployer: {
    name: "deployer",
    address: "0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E",
    privateKey: "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659",
    description: "Primary deployer account with highest ETH balance",
  } as TestAccount,

  /**
   * Account 1 - Alice
   * Derived from Hardhat's default mnemonic at index 0
   */
  alice: {
    name: "alice",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    description: "Test account for user scenarios",
  } as TestAccount,

  /**
   * Account 2 - Bob
   * Derived from Hardhat's default mnemonic at index 1
   */
  bob: {
    name: "bob",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    description: "Test account for secondary user scenarios",
  } as TestAccount,

  /**
   * Account 3 - Charlie
   * Derived from Hardhat's default mnemonic at index 2
   */
  charlie: {
    name: "charlie",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    description: "Test account for tertiary user scenarios",
  } as TestAccount,
} as const;

/**
 * Array of all test accounts for iteration
 */
export const TEST_ACCOUNTS_ARRAY: TestAccount[] = [
  NITRO_TEST_ACCOUNTS.deployer,
  NITRO_TEST_ACCOUNTS.alice,
  NITRO_TEST_ACCOUNTS.bob,
  NITRO_TEST_ACCOUNTS.charlie,
];

/**
 * Get a test account by name
 *
 * @param name - Account name from TESTS_ACCOUNTS_NAME enum
 * @returns Test account object
 */
export function getTestAccount(name: TESTS_ACCOUNTS_NAME): TestAccount {
  const lowerName = name.toLowerCase() as keyof typeof NITRO_TEST_ACCOUNTS;
  return NITRO_TEST_ACCOUNTS[lowerName];
}

/**
 * Get multiple test accounts by names
 *
 * @param names - Array of account names from TESTS_ACCOUNTS_NAME enum
 * @returns Array of test account objects
 */
export function getTestAccounts(names: TESTS_ACCOUNTS_NAME[]): TestAccount[] {
  return names.map((name) => getTestAccount(name));
}
