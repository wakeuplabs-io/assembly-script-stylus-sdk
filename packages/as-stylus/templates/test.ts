export function getTestFileTemplate(): string {
  return `
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
// Test state
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
    throw new Error(\`Contract deployment failed: \${error}\`);
  }
}, config.deployTimeout);

describe("Counter Contract Tests", () => {
  describe("deployment", () => {
    it("should deploy the contract", async () => {
      expect(contract.address).toBeDefined();
    });

    it("counter: should be the initial counter", async () => {
      const result = await contract.read("get", []);
      expect(result).toBe(0n);
    });
  });

  describe("operations", () => {
    it("increment: should increment the counter", async () => {
      await contract.write(walletClient, "increment", []);
      const counter = await contract.read("get", []);
      expect(counter).toBe(1n);
    });

    it("decrement: should decrement the counter", async () => {
      await contract.write(walletClient, "decrement", []);
      const counter = await contract.read("get", []);
      expect(counter).toBe(0n);
    });

    it("decrement: should revert if the counter is zero", async () => {
      const result = await expectRevertWrite(contract, walletClient, "decrement", []);
      expect(result.errorName).toBe("CounterZero");
      expect(result.args).toEqual([]);
    });
  });
});
  `;
}
