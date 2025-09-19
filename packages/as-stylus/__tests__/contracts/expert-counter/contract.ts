import {
  Contract,
  External,
  I256,
  I256Factory,
  U256,
  U256Factory,
  View,
} from "@wakeuplabs/as-stylus";

@Contract
export class ExpertCounter {
  unsignedCounter: U256;
  signedCounter: I256;

  maxIterations: U256;
  stepSize: U256;
  negativeStepSize: I256;

  constructor() {
    this.unsignedCounter = U256Factory.create();
    this.signedCounter = I256Factory.create();

    this.maxIterations = U256Factory.fromString("10");
    this.stepSize = U256Factory.fromString("1");
    this.negativeStepSize = I256Factory.fromString("-1");
  }

  @External
  setCounters(unsignedValue: U256, signedValue: I256): void {
    this.unsignedCounter = unsignedValue;
    this.signedCounter = signedValue;
  }

  @External
  setConfiguration(maxIter: U256, step: U256, negStep: I256): void {
    this.maxIterations = maxIter;
    this.stepSize = step;
    this.negativeStepSize = negStep;
  }

  @External
  tripleIncrement(): void {
    let iterator = U256Factory.create();
    const three = U256Factory.fromString("3");
    do {
      this.unsignedCounter = this.unsignedCounter.add(this.stepSize);
      iterator = iterator.add(U256Factory.fromString("1"));
    } while (iterator.lessThan(three));

    let iterator2 = I256Factory.create();
    const signedOne = I256Factory.fromString("1");
    const signedThree = I256Factory.fromString("3");
    do {
      this.signedCounter = this.signedCounter.add(signedOne);
      iterator2 = iterator2.add(signedOne);
    } while (iterator2.lessThan(signedThree));
  }

  @External
  bulkIncrement(times: U256): void {
    let iterator = U256Factory.create();
    let actualTimes = times;
    if (times.greaterThan(this.maxIterations)) {
      actualTimes = this.maxIterations;
    }

    while (iterator.lessThan(actualTimes)) {
      this.unsignedCounter = this.unsignedCounter.add(this.stepSize);

      const two = U256Factory.fromString("2");
      if (iterator.lessThan(two)) {
        this.signedCounter = this.signedCounter.add(I256Factory.fromString("1"));
      } else {
        this.signedCounter = this.signedCounter.add(this.negativeStepSize);
      }

      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }

  @External
  fibonacci(n: U256): void {
    const one = U256Factory.fromString("1");
    if (n.lessThanOrEqual(one)) {
      this.unsignedCounter = n;
      return;
    }

    let a = U256Factory.create(); // F(0) = 0
    let b = one; // F(1) = 1
    let iterator = U256Factory.fromString("2");

    while (iterator.lessThanOrEqual(n)) {
      const temp = a.add(b);
      a = b;
      b = temp;
      iterator = iterator.add(U256Factory.fromString("1"));
    }

    this.unsignedCounter = b;
  }

  @External
  countDown(start: U256): void {
    let current = start;
    const zero = U256Factory.create();
    const one = U256Factory.fromString("1");

    this.unsignedCounter = current;

    while (current.greaterThan(zero)) {
      current = current.sub(one);
      if (current.greaterThan(zero)) {
        this.unsignedCounter = current;
      }
    }
  }

  @External
  signedZigzag(cycles: U256): void {
    let iterator = U256Factory.create();
    let direction = I256Factory.fromString("1");

    this.signedCounter = I256Factory.create();

    while (iterator.lessThan(cycles)) {
      const steps = I256Factory.fromString("3");
      let step = I256Factory.create();

      while (step.lessThan(steps)) {
        this.signedCounter = this.signedCounter.add(direction);
        step = step.add(I256Factory.fromString("1"));
      }

      direction = direction.negate();
      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }

  @External
  simpleMultiply(a: U256, b: U256): void {
    this.unsignedCounter = a.mul(b);
  }

  @External
  factorial(n: U256): void {
    const one = U256Factory.fromString("1");

    if (n.lessThanOrEqual(one)) {
      this.unsignedCounter = one;
      return;
    }

    let i = U256Factory.fromString("2");
    let acc: U256 = one.copy();
    while (i.lessThanOrEqual(n)) {
      acc = acc.mul(i);
      i = i.add(one);
    }
    this.unsignedCounter = acc;
  }

  @External
  pow(base: U256, exp: U256): void {
    const zero = U256Factory.create();
    const one = U256Factory.fromString("1");

    if (exp.equals(zero)) {
      this.unsignedCounter = one;
      return;
    }

    if (exp.equals(one)) {
      this.unsignedCounter = base;
      return;
    }

    let result = one;
    let iterator = U256Factory.create();

    while (iterator.lessThan(exp)) {
      result = result.mul(base);
      iterator = iterator.add(one);
    }

    this.unsignedCounter = result;
  }

  @External
  gcd(a: U256, b: U256): void {
    const zero = U256Factory.create();
    let x = a.copy();
    let y = b.copy();

    while (!y.equals(zero)) {
      const tmp = y.copy();
      y = x.mod(y);
      x = tmp;
    }

    this.unsignedCounter = x;
  }

  @External
  reset(): void {
    this.unsignedCounter = U256Factory.create();
    this.signedCounter = I256Factory.create();
  }

  @External
  resetToValues(unsignedValue: U256, signedValue: I256): void {
    this.unsignedCounter = unsignedValue;
    this.signedCounter = signedValue;
  }

  @External
  forceU256Overflow(): void {
    const nearMax = U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639930",
    );
    this.unsignedCounter = nearMax;

    const increment = U256Factory.fromString("10");
    this.unsignedCounter = this.unsignedCounter.add(increment);
  }

  @External
  forceU256Underflow(): void {
    this.unsignedCounter = U256Factory.fromString("5");

    const decrement = U256Factory.fromString("10");
    this.unsignedCounter = this.unsignedCounter.sub(decrement);
  }

  @External
  forceI256Overflow(): void {
    const nearMaxPositive = I256Factory.fromString(
      "57896044618658097711785492504343953926634992332820282019728792003956564819960",
    );
    this.signedCounter = nearMaxPositive;

    const increment = I256Factory.fromString("20");
    this.signedCounter = this.signedCounter.add(increment);
  }

  @External
  forceI256Underflow(): void {
    const nearMinNegative = I256Factory.fromString(
      "-57896044618658097711785492504343953926634992332820282019728792003956564819960",
    );
    this.signedCounter = nearMinNegative;
    const decrement = I256Factory.fromString("20");
    this.signedCounter = this.signedCounter.sub(decrement);
  }

  @External
  testOverflowInLoop(): void {
    const one = U256Factory.fromString("1");
    const five = U256Factory.fromString("5");
    this.unsignedCounter = U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639933",
    );

    for (
      let iterator = U256Factory.create();
      iterator.lessThan(five);
      iterator = iterator.add(one)
    ) {
      // Overflow in iteration 3
      this.unsignedCounter = this.unsignedCounter.add(one);
    }
  }

  @External
  testSignedOverflowInLoop(): void {
    const five = I256Factory.fromString("5");
    this.signedCounter = I256Factory.fromString(
      "57896044618658097711785492504343953926634992332820282019728792003956564819965",
    );

    let iterator = I256Factory.create();
    do {
      // Overflow in iteration 3
      this.signedCounter = this.signedCounter.add(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    } while (iterator.lessThan(five));
  }

  @View
  getUnsigned(): U256 {
    return this.unsignedCounter;
  }

  @View
  getSigned(): I256 {
    return this.signedCounter;
  }

  @View
  getStepSize(): U256 {
    return this.stepSize;
  }

  @View
  getNegativeStepSize(): I256 {
    return this.negativeStepSize;
  }

  @View
  getMaxIterations(): U256 {
    return this.maxIterations;
  }

  @View
  isSignedNegative(): boolean {
    const isNegative: boolean = this.signedCounter.isNegative();
    return isNegative;
  }

  @View
  getSum(): I256 {
    const signedOne = I256Factory.fromString("1");
    let result = this.signedCounter;

    let iterator = U256Factory.create();
    while (iterator.lessThan(this.unsignedCounter)) {
      result = result.add(signedOne);
      iterator = iterator.add(U256Factory.fromString("1"));
    }

    return result;
  }
}
