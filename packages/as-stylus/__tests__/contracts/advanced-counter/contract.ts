// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class AdvancedCounter {
  // Contadores separados para unsigned y signed
  static unsignedCounter: U256;
  static signedCounter: I256;

  // Configuración
  static stepSize: U256;

  constructor() {
    // Inicializar contadores en cero
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();

    // Configuración por defecto
    stepSize = U256Factory.fromString("1");
  }

  @External
  static increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    unsignedCounter = unsignedCounter.add(delta);
  }

  @External
  static testForLoop(): void {
    // FOR loop: Incrementar unsignedCounter 5 veces
    for (
      let i: U256 = U256Factory.create();
      i.lessThan(U256Factory.fromString("5"));
      i = i.add(U256Factory.fromString("1"))
    ) {
      unsignedCounter = unsignedCounter.add(stepSize);
    }
  }

  @External
  static testWhileLoop(): void {
    // WHILE loop: Incrementar signedCounter mientras sea menor que 3
    let j: I256 = I256Factory.create();
    while (j.lessThan(I256Factory.fromString("3"))) {
      signedCounter = signedCounter.add(I256Factory.fromString("1"));
      j = j.add(I256Factory.fromString("1"));
    }
  }

  @External
  static testDoWhileLoop(): void {
    // DO-WHILE loop: Decrementar signedCounter al menos una vez
    let k: I256 = I256Factory.create();
    do {
      signedCounter = signedCounter.sub(I256Factory.fromString("1"));
      k = k.add(I256Factory.fromString("1"));
    } while (k.lessThan(I256Factory.fromString("2")));
  }

  @External
  static testMixedOperations(): void {
    // Test con diferentes tipos de números y operaciones
    const five: U256 = U256Factory.fromString("5");
    const negativeTwo: I256 = I256Factory.fromString("-2");

    // For loop con U256
    for (
      let i: U256 = U256Factory.create();
      i.lessThan(five);
      i = i.add(U256Factory.fromString("1"))
    ) {
      unsignedCounter = unsignedCounter.add(U256Factory.fromString("2"));
    }

    // While loop con I256
    let current: I256 = negativeTwo;
    while (current.lessThan(I256Factory.create())) {
      signedCounter = signedCounter.add(current);
      current = current.add(I256Factory.fromString("1"));
    }
  }
}
