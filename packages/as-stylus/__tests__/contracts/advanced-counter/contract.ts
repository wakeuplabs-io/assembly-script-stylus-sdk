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
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();
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
    const iterator = U256Factory.create();
    const iterations = U256Factory.fromString("5"); // 5
    for (
      iterator;
      iterator.lessThan(iterations); // 5
      iterator = iterator.add(U256Factory.fromString("1"))
    ) {
      unsignedCounter = unsignedCounter.add(stepSize);
    }
  }

  @External
  static testWhileLoop(): void {
    // WHILE loop: Incrementar signedCounter mientras sea menor que 3
    const iterator = I256Factory.create();
    const iterations = I256Factory.fromString("3"); // 3
    while (iterator.lessThan(iterations)) {
      signedCounter = signedCounter.add(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    }
  }

  @External
  static testDoWhileLoop(): void {
    // DO-WHILE loop: Decrementar signedCounter al menos una vez
    const iterator = I256Factory.create();
    const iterations = I256Factory.fromString("2"); // 2
    do {
      signedCounter = signedCounter.sub(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    } while (k.lessThan(I256Factory.fromString("2")));
  }

  @External
  static testMixedOperations(): void {
    // Test con diferentes tipos de números y operaciones
    const five: U256 = U256Factory.fromString("5");
    const negativeTwo: I256 = I256Factory.fromString("-2");
    const iterator = I256Factory.create();
    // For loop con U256
    for (
      iterator;
      iterator.lessThan(five);
      iterator = iterator.add(U256Factory.fromString("1"))
    ) {
      unsignedCounter = unsignedCounter.add(U256Factory.fromString("2"));
    }

    // While loop con I256
    const iterator2 = I256Factory.create();
    while (iterator2.lessThan(negativeTwo)) {
      signedCounter = signedCounter.add(iterator2);
      iterator2 = iterator2.add(I256Factory.fromString("1"));
    }
  }
}



////----





// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// @Contract
// export class AdvancedCounter {
//   // Contadores separados para unsigned y signed
//   static unsignedCounter: U256;
//   static signedCounter: I256;

//   // Configuración
//   static maxIterations: U256;
//   static stepSize: U256;
//   static negativeStepSize: I256;

//   constructor() {
//     // Inicializar contadores en cero
//     unsignedCounter = U256Factory.create();
//     signedCounter = I256Factory.create();

//     // Configuración por defecto
//     maxIterations = U256Factory.fromString("10");
//     stepSize = U256Factory.fromString("1");
//     negativeStepSize = I256Factory.fromString("-1");
//   }

//   @External
//   static setCounters(unsignedValue: U256, signedValue: I256): void {
//     unsignedCounter = unsignedValue;
//     signedCounter = signedValue;
//   }

//   @External
//   static setConfiguration(maxIter: U256, step: U256, negStep: I256): void {
//     maxIterations = maxIter;
//     stepSize = step;
//     negativeStepSize = negStep;
//   }

//   @External
//   static increment(): void {
//     const delta: U256 = U256Factory.fromString("1");
//     unsignedCounter = unsignedCounter.add(delta);
//   }

//   @External
//   static decrement(): void {
//     const delta: U256 = U256Factory.fromString("1");
//     unsignedCounter = unsignedCounter.sub(delta);
//   }

//   @External
//   static incrementSigned(): void {
//     const delta: I256 = I256Factory.fromString("1");
//     signedCounter = signedCounter.add(delta);
//   }

//   @External
//   static decrementSigned(): void {
//     const delta: I256 = I256Factory.fromString("1");
//     signedCounter = signedCounter.sub(delta);
//   }

//   @External
//   static doubleIncrement(): void {
//     // Increment both counters using for loops (2 iterations each)

//     // For loop to increment unsigned counter 2 times
//     for (
//       let i: U256 = U256Factory.create();
//       i.lessThan(U256Factory.fromString("2"));
//       i = i.add(U256Factory.fromString("1"))
//     ) {
//       unsignedCounter = unsignedCounter.add(stepSize);
//     }

//     // For loop to increment signed counter 2 times
//     const signedOne: I256 = I256Factory.fromString("1");
//     for (
//       let j: I256 = I256Factory.create();
//       j.lessThan(I256Factory.fromString("2"));
//       j = j.add(signedOne)
//     ) {
//       signedCounter = signedCounter.add(signedOne);
//     }
//   }

//   @External
//   static tripleIncrement(): void {
//     // Increment both counters using do-while loops (3 iterations each)

//     // Do-while loop to increment unsigned counter 3 times
//     let i: U256 = U256Factory.create();
//     do {
//       unsignedCounter = unsignedCounter.add(stepSize);
//       i = i.add(U256Factory.fromString("1"));
//     } while (i.lessThan(U256Factory.fromString("3")));

//     // Do-while loop to increment signed counter 3 times
//     let j: I256 = I256Factory.create();
//     const signedOne: I256 = I256Factory.fromString("1");
//     do {
//       signedCounter = signedCounter.add(signedOne);
//       j = j.add(signedOne);
//     } while (j.lessThan(I256Factory.fromString("3")));
//   }

  // @External
  // static bulkIncrement(times: U256): void {
  //   // Increment both counters a specific number of times
  //   let i: U256 = U256Factory.create();

  //   // Limit iterations to avoid infinite gas
  //   const actualTimes: U256 = times.lessThan(maxIterations) ? times : maxIterations;

  //   while (i.lessThan(actualTimes)) {
  //     // Incrementar unsigned
  //     unsignedCounter = unsignedCounter.add(stepSize);

  //     // Toggle increment/decrement in signed
  //     const two: U256 = U256Factory.fromString("2");
  //     if (i.lessThan(two)) {
  //       signedCounter = signedCounter.add(I256Factory.fromString("1"));
  //     } else {
  //       signedCounter = signedCounter.add(negativeStepSize);
  //     }

  //     i = i.add(U256Factory.fromString("1"));
  //   }
  // }

  // @External
  // static fibonacci(n: U256): void {
  //   // Calculate Fibonacci sequence and store in unsigned counter
  //   if (n.lessThanOrEqual(U256Factory.fromString("1"))) {
  //     unsignedCounter = n;
  //     return;
  //   }

  //   let a: U256 = U256Factory.create(); // F(0) = 0
  //   let b: U256 = U256Factory.fromString("1"); // F(1) = 1
  //   let i: U256 = U256Factory.fromString("2");

  //   while (i.lessThanOrEqual(n)) {
  //     const temp: U256 = a.add(b);
  //     a = b;
  //     b = temp;
  //     i = i.add(U256Factory.fromString("1"));
  //   }

  //   unsignedCounter = b;
  // }

  // @External
  // static countDown(start: U256): void {
  //   // Count down from start to 0
  //   let current: U256 = start;
  //   const _zero: U256 = U256Factory.create();
  //   const one: U256 = U256Factory.fromString("1");

  //   unsignedCounter = current;

  //   while (current.greaterThan(_zero)) {
  //     current = current.sub(one);
  //     if (current.greaterThan(_zero)) {
  //       unsignedCounter = current;
  //     }
  //   }
  // }

  // @External
  // static signedZigzag(cycles: U256): void {
  //   let i: U256 = U256Factory.create();
  //   let direction: I256 = I256Factory.fromString("1");

  //   signedCounter = I256Factory.create(); // Reset to zero

  //   while (i.lessThan(cycles)) {
  //     const steps: I256 = I256Factory.fromString("3");
  //     let step: I256 = I256Factory.create();

  //     while (step.lessThan(steps)) {
  //       signedCounter = signedCounter.add(direction);
  //       step = step.add(I256Factory.fromString("1"));
  //     }

  //     direction = direction.negate();
  //     i = i.add(U256Factory.fromString("1"));
  //   }
  // }

  // @External
  // static reset(): void {
  //   unsignedCounter = U256Factory.create();
  //   signedCounter = I256Factory.create();
  // }

  // @External
  // static resetToValues(unsignedValue: U256, signedValue: I256): void {
  //   unsignedCounter = unsignedValue;
  //   signedCounter = signedValue;
  // }

  // // Métodos para forzar overflow/underflow modificando storage
  // @External
  // static forceU256Overflow(): void {
  //   // U256 max = 2^256 - 1 = 115792089237316195423570985008687907853269984665640564039457584007913129639935
  //   const nearMax: U256 = U256Factory.fromString(
  //     "115792089237316195423570985008687907853269984665640564039457584007913129639930",
  //   );
  //   unsignedCounter = nearMax;

  //   // Ahora intentar sumar algo que cause overflow
  //   const increment: U256 = U256Factory.fromString("10");
  //   unsignedCounter = unsignedCounter.addChecked(increment); // Esto debería causar panic 0x11
  // }

  // @External
  // static forceU256Underflow(): void {
  //   // Establecer valor pequeño en storage
  //   unsignedCounter = U256Factory.fromString("5");

  //   // Intentar restar un valor mayor que cause underflow
  //   const decrement: U256 = U256Factory.fromString("10");
  //   unsignedCounter = unsignedCounter.subChecked(decrement); // Esto debería causar panic 0x11
  // }

  // @External
  // static forceI256Overflow(): void {
  //   // I256 max = 2^255 - 1 = 57896044618658097711785492504343953926634992332820282019728792003956564819967
  //   const nearMaxPositive: I256 = I256Factory.fromString(
  //     "57896044618658097711785492504343953926634992332820282019728792003956564819960",
  //   );
  //   signedCounter = nearMaxPositive;

  //   // Intentar sumar algo que cause overflow positivo
  //   const increment: I256 = I256Factory.fromString("20");
  //   signedCounter = signedCounter.add(increment); // Esto debería causar panic 0x11
  // }

  // @External
  // static forceI256Underflow(): void {
  //   // I256 min = -2^255 = -57896044618658097711785492504343953926634992332820282019728792003956564819968
  //   const nearMinNegative: I256 = I256Factory.fromString(
  //     "-57896044618658097711785492504343953926634992332820282019728792003956564819960",
  //   );
  //   signedCounter = nearMinNegative;
  //   const decrement: I256 = I256Factory.fromString("20");
  //   signedCounter = signedCounter.sub(decrement); // Esto debería causar panic 0x11
  // }

  // @External
  // static testOverflowInLoop(): void {
  //   // Demostrate overflow in loop
  //   unsignedCounter = U256Factory.fromString(
  //     "115792089237316195423570985008687907853269984665640564039457584007913129639933",
  //   );

  //   // Loop that increment until overflow
  //   for (
  //     let i: U256 = U256Factory.create();
  //     i.lessThan(U256Factory.fromString("5"));
  //     i = i.add(U256Factory.fromString("1"))
  //   ) {
  //     unsignedCounter = unsignedCounter.addChecked(U256Factory.fromString("1")); // Overflow en iteración 3
  //   }
  // }

  // @External
  // static testSignedOverflowInLoop(): void {
  //   // Demonstrate I256 overflow in loop
  //   signedCounter = I256Factory.fromString(
  //     "57896044618658097711785492504343953926634992332820282019728792003956564819965",
  //   );

  //   // Do-while that increment until overflow
  //   let i: I256 = I256Factory.create();
  //   do {
  //     signedCounter = signedCounter.add(I256Factory.fromString("1")); // Overflow después de pocas iteraciones
  //     i = i.add(I256Factory.fromString("1"));
  //   } while (i.lessThan(I256Factory.fromString("5")));
  // }

  // // Query methods (View)
  // @View
  // static getUnsigned(): U256 {
  //   return unsignedCounter.toString();
  // }

  // @View
  // static getSigned(): I256 {
  //   return signedCounter.toString();
  // }

  // @View
  // static getBothCounters(): string {
  //   const unsignedStr = unsignedCounter.toString();
  //   const signedStr = signedCounter.toString();
  //   return unsignedStr + "," + signedStr;
  // }

  // @View
  // static getConfiguration(): string {
  //   const maxStr = maxIterations.toString();
  //   const stepStr = stepSize.toString();
  //   const negStepStr = negativeStepSize.toString();
  //   return maxStr + "," + stepStr + "," + negStepStr;
  // }

  // @View
  // static isSignedNegative(): boolean {
  //   return signedCounter.isNegative();
  // }

  // @View
  // static getSum(): I256 {
  //   // Sum of both counters (for demonstration)
  //   const signedOne: I256 = I256Factory.fromString("1");
  //   let result: I256 = signedCounter;

  //   // Simulate sum by adding unsigned as iterations of +1
  //   let i: U256 = U256Factory.create();
  //   while (i.lessThan(unsignedCounter)) {
  //     result = result.add(signedOne);
  //     i = i.add(U256Factory.fromString("1"));
  //   }

  //   return result;
  // }
}
