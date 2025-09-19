import {
  Contract,
  External,
  U256,
  U256Factory,
  I256,
  I256Factory,
  View,
} from "@wakeuplabs/as-stylus";

@Contract
export class AdvancedCounter {
  unsignedCounter: U256;
  signedCounter: I256;

  stepSize: U256;

  constructor() {
    this.unsignedCounter = U256Factory.create();
    this.signedCounter = I256Factory.create();
    this.stepSize = U256Factory.fromString("1");
  }

  @External
  increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    this.unsignedCounter = this.unsignedCounter.add(delta);
  }

  @External
  testForLoop(): void {
    const iterations = U256Factory.fromString("5");
    const one = U256Factory.fromString("1");
    for (
      let iterator = U256Factory.create();
      iterator.lessThan(iterations);
      iterator = iterator.add(one)
    ) {
      this.unsignedCounter = this.unsignedCounter.add(this.stepSize);
    }
  }

  @External
  testWhileLoop(): void {
    let iterator = I256Factory.create();
    const iterations = I256Factory.fromString("3");
    const one = I256Factory.fromString("1");
    while (iterator.lessThan(iterations)) {
      this.signedCounter = this.signedCounter.add(one);
      iterator = iterator.add(one);
    }
  }

  @External
  testDoWhileLoop(): void {
    let iterator = I256Factory.create();
    const iterations = I256Factory.fromString("2");
    do {
      this.signedCounter = this.signedCounter.sub(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    } while (iterator.lessThan(iterations));
  }

  @External
  testMixedOperations(): void {
    const five: U256 = U256Factory.fromString("5");
    const negativeTwo: I256 = I256Factory.fromString("-2");
    const one: U256 = U256Factory.fromString("1");
    const two: U256 = U256Factory.fromString("2");

    for (
      let iterator = U256Factory.create();
      iterator.lessThan(five);
      iterator = iterator.add(one)
    ) {
      this.unsignedCounter = this.unsignedCounter.add(two);
    }

    let iterator2: I256 = I256Factory.create();
    const iOne = I256Factory.fromString("1");
    while (iterator2.lessThan(negativeTwo)) {
      this.signedCounter = this.signedCounter.add(iterator2);
      iterator2 = iterator2.add(iOne);
    }
  }

  @View
  getUnsignedCounter(): U256 {
    return this.unsignedCounter;
  }

  @View
  getSignedCounter(): I256 {
    return this.signedCounter;
  }

  @View
  getStepSize(): U256 {
    return this.stepSize;
  }
}
