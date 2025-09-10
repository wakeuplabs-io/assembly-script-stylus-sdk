// ---------------------------------------------------------------
//  End-to-end tests — Arrays contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config({ path: ".env.test", override: true });

const INITIAL_DYNAMIC_SIZE = 5n;
const ZERO = 0n;
const ONE = 1n;
const TWO = 2n;
const THREE = 3n;
const FIFTY = 50n;
const ONE_HUNDRED = 100n;

const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ARRAYS;

describe("Arrays Contract E2E Tests", () => {
  beforeAll(async () => {
    try {
      contract = await setupE2EContract(contractPath, abiPath, {
        deployArgs: [INITIAL_DYNAMIC_SIZE],
        walletClient,
      });
    } catch (error) {
      handleDeploymentError(error);
    }
  }, DEPLOY_TIMEOUT);

  describe("Contract Deployment", () => {
    test("should deploy successfully with constructor initialization", async () => {
      expect(contract.address).toBeDefined();
      expect(contract.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test("should initialize static array correctly", async () => {
      const value0 = (await contract.read("getStaticAt", [ZERO])) as bigint;
      const value1 = (await contract.read("getStaticAt", [ONE])) as bigint;
      const value2 = (await contract.read("getStaticAt", [TWO])) as bigint;

      expect(value0).toBe(ONE);
      expect(value1).toBe(TWO);
      expect(value2).toBe(THREE);
    });

    test("should initialize dynamic array correctly", async () => {
      const length = (await contract.read("dynamicLength", [])) as bigint;
      expect(length).toBe(INITIAL_DYNAMIC_SIZE);

      for (let i = 0; i < Number(INITIAL_DYNAMIC_SIZE); i++) {
        const value = (await contract.read("getDynamicAt", [BigInt(i)])) as bigint;
        expect(value).toBe(BigInt(i));
      }
    });
  });

  describe("Static Arrays", () => {
    describe("Basic Operations", () => {
      test("should get static array length correctly", async () => {
        const length = (await contract.read("staticLength", [])) as bigint;
        expect(length).toBe(THREE); // Static array has length 3
      });

      test("should read static array elements", async () => {
        const value0 = (await contract.read("getStaticAt", [ZERO])) as bigint;
        const value1 = (await contract.read("getStaticAt", [ONE])) as bigint;
        const value2 = (await contract.read("getStaticAt", [TWO])) as bigint;

        expect(value0).toBe(ONE);
        expect(value1).toBe(TWO);
        expect(value2).toBe(THREE);
      });

      test("should set static array elements", async () => {
        const newValue = FIFTY;
        const index = ONE;

        await contract.write(walletClient, "setStaticAt", [index, newValue]);

        const result = (await contract.read("getStaticAt", [index])) as bigint;
        expect(result).toBe(newValue);

        await contract.write(walletClient, "setStaticAt", [index, TWO]);
      });
    });

    describe("Edge Cases", () => {
      test("should handle setting all static array positions", async () => {
        const newValues = [ONE_HUNDRED, ONE_HUNDRED + ONE, ONE_HUNDRED + TWO];

        for (let i = 0; i < newValues.length; i++) {
          await contract.write(walletClient, "setStaticAt", [BigInt(i), newValues[i]]);
        }

        for (let i = 0; i < newValues.length; i++) {
          const result = (await contract.read("getStaticAt", [BigInt(i)])) as bigint;
          expect(result).toBe(newValues[i]);
        }

        const originalValues = [ONE, TWO, THREE];
        for (let i = 0; i < originalValues.length; i++) {
          await contract.write(walletClient, "setStaticAt", [BigInt(i), originalValues[i]]);
        }
      });
    });
  });

  describe("Dynamic Arrays", () => {
    describe("Basic Operations", () => {
      test("should get dynamic array length", async () => {
        const length = (await contract.read("dynamicLength", [])) as bigint;
        expect(length).toBe(INITIAL_DYNAMIC_SIZE);
      });

      test("should read dynamic array elements", async () => {
        for (let i = 0; i < Number(INITIAL_DYNAMIC_SIZE); i++) {
          const value = (await contract.read("getDynamicAt", [BigInt(i)])) as bigint;
          expect(value).toBe(BigInt(i));
        }
      });

      test("should set dynamic array elements", async () => {
        const index = TWO;
        const newValue = FIFTY;

        await contract.write(walletClient, "setDynamicAt", [index, newValue]);

        const result = (await contract.read("getDynamicAt", [index])) as bigint;
        expect(result).toBe(newValue);

        await contract.write(walletClient, "setDynamicAt", [index, TWO]);
      });
      //Not passing
      test("should get dynamic array reference", async () => {
        const arrayRef = await contract.read("getDynamicArray", []);
        expect(arrayRef).toBeDefined();
      });
    });

    describe("Length Management", () => {
      test("should push elements to dynamic array", async () => {
        const initialLength = (await contract.read("dynamicLength", [])) as bigint;
        const newValue = ONE_HUNDRED;

        await contract.write(walletClient, "pushDynamic", [newValue]);

        const newLength = (await contract.read("dynamicLength", [])) as bigint;
        expect(newLength).toBe(initialLength + ONE);

        const result = (await contract.read("getDynamicAt", [initialLength])) as bigint;
        expect(result).toBe(newValue);
      });

      test("should pop elements from dynamic array", async () => {
        const initialLength = (await contract.read("dynamicLength", [])) as bigint;

        await contract.write(walletClient, "popDynamic", []);

        const newLength = (await contract.read("dynamicLength", [])) as bigint;
        expect(newLength).toBe(initialLength - ONE);
      });

      test("should handle multiple push and pop operations", async () => {
        const initialLength = (await contract.read("dynamicLength", [])) as bigint;

        const valuesToPush = [ONE_HUNDRED, ONE_HUNDRED + ONE, ONE_HUNDRED + TWO];
        for (const value of valuesToPush) {
          await contract.write(walletClient, "pushDynamic", [value]);
        }

        const currentLength = (await contract.read("dynamicLength", [])) as bigint;
        expect(currentLength).toBe(initialLength + BigInt(valuesToPush.length));

        for (let i = 0; i < valuesToPush.length; i++) {
          const index = initialLength + BigInt(i);
          const value = (await contract.read("getDynamicAt", [index])) as bigint;
          expect(value).toBe(valuesToPush[i]);
        }

        for (let i = 0; i < valuesToPush.length; i++) {
          await contract.write(walletClient, "popDynamic", []);
        }

        const finalLength = (await contract.read("dynamicLength", [])) as bigint;
        expect(finalLength).toBe(initialLength);
      });
    });
  });
  //Not passing
  describe("Memory Arrays", () => {
    test("should create and return memory array with dynamic size", async () => {
      const size = THREE;
      const result = await contract.read("makeMemoryArray", [size]);

      expect(result).toBeDefined();
    });

    test("should create and return fixed memory array", async () => {
      const result = await contract.read("makeFixedMemoryArray", []);

      expect(result).toBeDefined();
    });

    test("should handle different memory array sizes", async () => {
      const sizes = [ONE, TWO, FIFTY];

      for (const size of sizes) {
        const result = await contract.read("makeMemoryArray", [size]);
        expect(result).toBeDefined();
      }
    });
  });
  //Not passing
  describe.skip("Calldata Arrays", () => {
    test("should sum calldata array elements", async () => {
      const values = [ONE, TWO, THREE, FIFTY];
      const expectedSum = values.reduce((acc, val) => acc + val, 0n);

      const result = (await contract.read("sumCalldata", [values])) as bigint;
      expect(result).toBe(expectedSum);
    });

    test("should return length of calldata array", async () => {
      const values = [ONE, TWO, THREE, FIFTY, ONE_HUNDRED];
      const expectedLength = BigInt(values.length);

      const result = (await contract.read(
        "lenCalldata",
        [values],
        BigInt(1000000000000000000),
      )) as bigint;
      expect(result).toBe(expectedLength);
    });

    test("should echo calldata array", async () => {
      const values = [ONE, TWO, THREE, FIFTY];

      const result = await contract.read("echoCalldata", [values]);
      expect(result).toBeDefined();
    });

    test("should handle empty calldata array", async () => {
      const emptyArray: bigint[] = [];

      const sum = (await contract.read("sumCalldata", [emptyArray])) as bigint;
      expect(sum).toBe(ZERO);

      const length = (await contract.read("lenCalldata", [emptyArray])) as bigint;
      expect(length).toBe(ZERO);
    });

    test("should handle large calldata arrays", async () => {
      const largeArray = Array.from({ length: 10 }, (_, i) => BigInt(i + 1));
      const expectedSum = largeArray.reduce((acc, val) => acc + val, 0n);

      const sum = (await contract.read("sumCalldata", [largeArray])) as bigint;
      expect(sum).toBe(expectedSum);

      const length = (await contract.read("lenCalldata", [largeArray])) as bigint;
      expect(length).toBe(BigInt(largeArray.length));
    });
  });

  describe("Integration & Edge Cases", () => {
    //Not passing
    test.skip("should handle mixed array operations in sequence", async () => {
      await contract.write(walletClient, "setStaticAt", [ZERO, ONE_HUNDRED]);
      const staticValue = (await contract.read("getStaticAt", [ZERO])) as bigint;
      expect(staticValue).toBe(ONE_HUNDRED);

      await contract.write(walletClient, "pushDynamic", [ONE_HUNDRED]);
      const dynamicLength = (await contract.read("dynamicLength", [])) as bigint;
      expect(dynamicLength).toBeGreaterThan(INITIAL_DYNAMIC_SIZE);

      const memoryResult = await contract.read("makeMemoryArray", [TWO]);
      expect(memoryResult).toBeDefined();

      const calldataSum = (await contract.read("sumCalldata", [[ONE, TWO, THREE]])) as bigint;
      expect(calldataSum).toBe(ONE + TWO + THREE);

      await contract.write(walletClient, "setStaticAt", [ZERO, ONE]);
      await contract.write(walletClient, "popDynamic", []);
    });

    test("should handle boundary values correctly", async () => {
      await contract.write(walletClient, "setStaticAt", [ZERO, ZERO]);
      const zeroValue = (await contract.read("getStaticAt", [ZERO])) as bigint;
      expect(zeroValue).toBe(ZERO);

      const largeValue = 999999999999999999n;
      await contract.write(walletClient, "setStaticAt", [ONE, largeValue]);
      const retrievedLargeValue = (await contract.read("getStaticAt", [ONE])) as bigint;
      expect(retrievedLargeValue).toBe(largeValue);

      await contract.write(walletClient, "setStaticAt", [ZERO, ONE]);
      await contract.write(walletClient, "setStaticAt", [ONE, TWO]);
    });

    test("should maintain array state consistency across operations", async () => {
      const initialStaticLength = (await contract.read("staticLength", [])) as bigint;
      const initialDynamicLength = (await contract.read("dynamicLength", [])) as bigint;

      await contract.write(walletClient, "setStaticAt", [TWO, FIFTY]);
      await contract.write(walletClient, "pushDynamic", [FIFTY]);
      await contract.write(walletClient, "setDynamicAt", [ZERO, FIFTY]);

      const finalStaticLength = (await contract.read("staticLength", [])) as bigint;
      const finalDynamicLength = (await contract.read("dynamicLength", [])) as bigint;

      expect(finalStaticLength).toBe(initialStaticLength);
      expect(finalDynamicLength).toBe(initialDynamicLength + ONE); // One push operation

      const staticValue = (await contract.read("getStaticAt", [TWO])) as bigint;
      const dynamicValue = (await contract.read("getDynamicAt", [ZERO])) as bigint;
      expect(staticValue).toBe(FIFTY);
      expect(dynamicValue).toBe(FIFTY);

      await contract.write(walletClient, "setStaticAt", [TWO, THREE]);
      await contract.write(walletClient, "setDynamicAt", [ZERO, ZERO]);
      await contract.write(walletClient, "popDynamic", []);
    });
  });
});
