// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class AdvancedCounter {
  static unsignedCounter: U256;
  static signedCounter: I256;

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
    const iterations = U256Factory.fromString("5");
    const one = U256Factory.fromString("1");
    for (
      let iterator = U256Factory.create();
      iterator.lessThan(iterations);
      iterator = iterator.add(one)
    ) {
      unsignedCounter = unsignedCounter.add(stepSize);
    }
  }

  @External
  static testWhileLoop(): void {
    let iterator = I256Factory.create();
    const iterations = I256Factory.fromString("3");
    const one = I256Factory.fromString("1");
    while (iterator.lessThan(iterations)) {
      signedCounter = signedCounter.add(one);
      iterator = iterator.add(one);
    }
  }

  @External
  static testDoWhileLoop(): void {
    let iterator = I256Factory.create();
    const iterations = I256Factory.fromString("2");
    do {
      signedCounter = signedCounter.sub(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    } while (iterator.lessThan(iterations));
  }

  @External
  static testMixedOperations(): void {
    const five: U256 = U256Factory.fromString("5");
    const negativeTwo: I256 = I256Factory.fromString("-2");
    const one: U256 = U256Factory.fromString("1");
    const two: U256 = U256Factory.fromString("2");

    for (
      let iterator = U256Factory.create();
      iterator.lessThan(five);
      iterator = iterator.add(one)
    ) {
      unsignedCounter = unsignedCounter.add(two);
    }

    let iterator2: I256 = I256Factory.create();
    const iOne = I256Factory.fromString("1");
    while (iterator2.lessThan(negativeTwo)) {
      signedCounter = signedCounter.add(iterator2);
      iterator2 = iterator2.add(iOne);
    }
  }

  @View
  static getUnsignedCounter(): U256 {
    return unsignedCounter;
  }

  @View
  static getSignedCounter(): I256 {
    return signedCounter;
  }

  @View
  static getStepSize(): U256 {
    return stepSize;
  }
}
