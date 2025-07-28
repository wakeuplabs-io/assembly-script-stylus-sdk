// ---------------------------------------------------------------
//  End-to-end tests — Advanced Counter contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Address, Hex, WalletClient } from "viem";

import { contractService, getWalletClient } from "../helpers/client.js";
import {
  CONTRACT_PATHS,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "../helpers/constants.js";
import { fundUser, setupE2EContract } from "../helpers/setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

config();

// Test state
const ownerWallet: WalletClient = getWalletClient(PRIVATE_KEY as Hex);
const userBWallet: WalletClient = getWalletClient(USER_B_PRIVATE_KEY as Hex);
let contract: ReturnType<typeof contractService>;
const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.ADVANCED_COUNTER;
const _getOwnerAddress = (): Address => ownerWallet.account?.address as Address;
const getUserBAddress = (): Address => userBWallet.account?.address as Address;

beforeAll(async () => {
  try {
    fundUser(getUserBAddress());
    contract = await setupE2EContract(contractPath, abiPath, {
      deployArgs: [],
      walletClient: ownerWallet,
    });
  } catch (error: unknown) {
    handleDeploymentError(error);
  }
}, DEPLOY_TIMEOUT);

describe("Advanced Counter — Pruebas de Consistencia de Estado", () => {
  describe("Estado inicial", () => {
    it("debería tener contadores inicializados en cero y stepSize en 1", async () => {
      const unsignedCounter = (await contract.read("getUnsignedCounter", [])) as bigint;
      const signedCounter = (await contract.read("getSignedCounter", [])) as bigint;
      const stepSize = (await contract.read("getStepSize", [])) as bigint;

      expect(unsignedCounter).toBe(0n);
      expect(signedCounter).toBe(0n);
      expect(stepSize).toBe(1n);
    });
  });

  describe("Función increment() — Incremento básico", () => {
    it("debería incrementar unsignedCounter en 1", async () => {
      const initial = (await contract.read("getUnsignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "increment", []);

      const final = (await contract.read("getUnsignedCounter", [])) as bigint;
      expect(final).toBe(initial + 1n);
    });

    it("no debería afectar signedCounter", async () => {
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "increment", []);

      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;
      expect(finalSigned).toBe(initialSigned);
    });

    it("debería funcionar múltiples veces consecutivas", async () => {
      const initial = (await contract.read("getUnsignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "increment", []);
      await contract.write(ownerWallet, "increment", []);
      await contract.write(ownerWallet, "increment", []);

      const final = (await contract.read("getUnsignedCounter", [])) as bigint;
      expect(final).toBe(initial + 3n);
    });
  });

  describe("testForLoop() — For loop con U256", () => {
    it("debería incrementar unsignedCounter exactamente 5 veces", async () => {
      const initialUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testForLoop", []);

      const finalUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;

      // El for loop hace 5 iteraciones, cada una incrementa por stepSize (1)
      expect(finalUnsigned).toBe(initialUnsigned + 5n);
      // No debería afectar el contador signed
      expect(finalSigned).toBe(initialSigned);
    });

    it("debería ser consistente en múltiples ejecuciones", async () => {
      const initial = (await contract.read("getUnsignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testForLoop", []);
      const afterFirst = (await contract.read("getUnsignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testForLoop", []);
      const afterSecond = (await contract.read("getUnsignedCounter", [])) as bigint;

      expect(afterFirst).toBe(initial + 5n);
      expect(afterSecond).toBe(initial + 10n);
    });
  });

  describe("testWhileLoop() — While loop con I256", () => {
    it("debería incrementar signedCounter exactamente 3 veces", async () => {
      const initialUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testWhileLoop", []);

      const finalUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;

      // El while loop ejecuta while iterator < 3, entonces 3 iteraciones
      expect(finalSigned).toBe(initialSigned + 3n);
      // No debería afectar el contador unsigned
      expect(finalUnsigned).toBe(initialUnsigned);
    });

    it("debería manejar condiciones I256.lessThan correctamente", async () => {
      const initial = (await contract.read("getSignedCounter", [])) as bigint;

      // Ejecutar múltiples veces para verificar consistencia de la condición
      await contract.write(ownerWallet, "testWhileLoop", []);
      await contract.write(ownerWallet, "testWhileLoop", []);

      const final = (await contract.read("getSignedCounter", [])) as bigint;
      expect(final).toBe(initial + 6n); // 3 + 3 = 6
    });
  });

  describe("testDoWhileLoop() — Do-while loop con I256", () => {
    it("debería decrementar signedCounter exactamente 2 veces", async () => {
      const initialUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testDoWhileLoop", []);

      const finalUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;

      // El do-while hace 2 decrementos
      expect(finalSigned).toBe(initialSigned - 2n);
      // No debería afectar el contador unsigned
      expect(finalUnsigned).toBe(initialUnsigned);
    });

    it("debería ejecutar al menos una vez (naturaleza do-while)", async () => {
      // Primero establecer un valor base para tener un cambio observable
      await contract.write(ownerWallet, "testWhileLoop", []); // +3
      const beforeDoWhile = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testDoWhileLoop", []); // -2
      const afterDoWhile = (await contract.read("getSignedCounter", [])) as bigint;

      expect(afterDoWhile).toBe(beforeDoWhile - 2n);
    });
  });

  describe("testMixedOperations() — Operaciones mixtas U256/I256", () => {
    it("debería manejar correctamente ambos tipos en una sola función", async () => {
      const initialUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      await contract.write(ownerWallet, "testMixedOperations", []);

      const finalUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;

      // For loop interno: 5 iteraciones * 2 = +10 al unsigned counter
      expect(finalUnsigned).toBe(initialUnsigned + 10n);

      // While loop interno: iterator2 = 0, negativeTwo = -2
      // Condición: 0 < -2 es falsa, entonces NO se ejecuta
      expect(finalSigned).toBe(initialSigned);
    });

    it("debería usar U256.lessThan para variables U256 y I256.lessThan para variables I256", async () => {
      // Este test verifica que el sistema de tipos funciona correctamente
      const initialState = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      // Si hay error de tipos, esta función fallaría
      await contract.write(ownerWallet, "testMixedOperations", []);

      const finalState = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      // Verificar cambios específicos esperados
      expect(finalState.unsigned).toBe(initialState.unsigned + 10n);
      expect(finalState.signed).toBe(initialState.signed);
    });
  });

  describe("Casos edge y verificación de tipos", () => {
    it("debería mantener estado consistente tras operaciones secuenciales", async () => {
      // Obtener estado inicial
      const initial = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      // Secuencia de operaciones conocidas
      await contract.write(ownerWallet, "increment", []); // +1 unsigned
      await contract.write(ownerWallet, "testForLoop", []); // +5 unsigned
      await contract.write(ownerWallet, "testWhileLoop", []); // +3 signed
      await contract.write(ownerWallet, "testDoWhileLoop", []); // -2 signed

      const final = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      // Verificar matemática exacta
      expect(final.unsigned).toBe(initial.unsigned + 6n); // 1 + 5 = 6
      expect(final.signed).toBe(initial.signed + 1n); // 3 - 2 = 1
    });

    it("debería funcionar correctamente desde diferentes wallets", async () => {
      const initialUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const initialSigned = (await contract.read("getSignedCounter", [])) as bigint;

      // Operaciones desde wallet owner
      await contract.write(ownerWallet, "increment", []); // +1 unsigned

      // Operaciones desde wallet userB
      await contract.write(userBWallet, "testWhileLoop", []); // +3 signed

      // Verificar que ambas operaciones afectaron el estado correctamente
      const finalUnsigned = (await contract.read("getUnsignedCounter", [])) as bigint;
      const finalSigned = (await contract.read("getSignedCounter", [])) as bigint;

      expect(finalUnsigned).toBe(initialUnsigned + 1n);
      expect(finalSigned).toBe(initialSigned + 3n);
    });

    it("debería manejar valores grandes sin overflow en condiciones", async () => {
      // Test de estrés: ejecutar muchas operaciones para verificar que
      // las condiciones de loop manejan valores grandes correctamente
      const initial = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      // Múltiples ejecuciones para acumular valores
      for (let i = 0; i < 5; i++) {
        await contract.write(ownerWallet, "testForLoop", []); // +5 cada vez
        await contract.write(ownerWallet, "testWhileLoop", []); // +3 cada vez
      }

      const final = {
        unsigned: (await contract.read("getUnsignedCounter", [])) as bigint,
        signed: (await contract.read("getSignedCounter", [])) as bigint,
      };

      expect(final.unsigned).toBe(initial.unsigned + 25n); // 5 * 5 = 25
      expect(final.signed).toBe(initial.signed + 15n); // 5 * 3 = 15
    });
  });
});
