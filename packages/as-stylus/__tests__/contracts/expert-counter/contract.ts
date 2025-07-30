// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class ExpertCounter {
  static unsignedCounter: U256;
  static signedCounter: I256;

  static maxIterations: U256;
  static stepSize: U256;
  static negativeStepSize: I256;

  constructor() {
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();

    maxIterations = U256Factory.fromString("10");
    stepSize = U256Factory.fromString("1");
    negativeStepSize = I256Factory.fromString("-1");
  }

  @External
  static setCounters(unsignedValue: U256, signedValue: I256): void {
    unsignedCounter = unsignedValue;
    signedCounter = signedValue;
  }

  @External
  static setConfiguration(maxIter: U256, step: U256, negStep: I256): void {
    maxIterations = maxIter;
    stepSize = step;
    negativeStepSize = negStep;
  }

  @External
  static tripleIncrement(): void {
    let iterator = U256Factory.create();
    const three = U256Factory.fromString("3");
    do {
      unsignedCounter = unsignedCounter.add(stepSize);
      iterator = iterator.add(U256Factory.fromString("1"));
    } while (iterator.lessThan(three));

    let iterator2 = I256Factory.create();
    const signedOne = I256Factory.fromString("1");
    do {
      signedCounter = signedCounter.add(signedOne);
      iterator2 = iterator2.add(signedOne);
    } while (iterator2.lessThan(three));
  }

  @External
  static bulkIncrement(times: U256): void {
    let iterator = U256Factory.create();
    let actualTimes = times;
    if (times.lessThan(maxIterations)) {
      actualTimes = maxIterations;
    }

    while (iterator.lessThan(actualTimes)) {
      unsignedCounter = unsignedCounter.add(stepSize);

      const two = U256Factory.fromString("2");
      if (iterator.lessThan(two)) {
        signedCounter = signedCounter.add(I256Factory.fromString("1"));
      } else {
        signedCounter = signedCounter.add(negativeStepSize);
      }

      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }

  @External
  static fibonacci(n: U256): void {
    const one = U256Factory.fromString("1");
    if (n.lessThanOrEqual(one)) {
      unsignedCounter = n;
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

    unsignedCounter = b;
  }

  @External
  static countDown(start: U256): void {
    let current = start;
    const _zero = U256Factory.create();
    const one = U256Factory.fromString("1");

    unsignedCounter = current;

    while (current.greaterThan(_zero)) {
      current = current.sub(one);
      if (current.greaterThan(_zero)) {
        unsignedCounter = current;
      }
    }
  }

  @External
  static signedZigzag(cycles: U256): void {
    let iterator = U256Factory.create();
    let direction = I256Factory.fromString("1");

    signedCounter = I256Factory.create();

    while (iterator.lessThan(cycles)) {
      const steps = I256Factory.fromString("3");
      let step = I256Factory.create();

      while (step.lessThan(steps)) {
        signedCounter = signedCounter.add(direction);
        step = step.add(I256Factory.fromString("1"));
      }

      direction = direction.negate();
      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }


  @External
  static factorial(n: U256): void {
    const one = U256Factory.fromString("1");
    let i = U256Factory.fromString("2");
    let acc = U256Factory.fromString("1");

    while (i.lessThanOrEqual(n)) {
      acc = acc.mul(i);
      i = i.add(one);
    }
    unsignedCounter = acc;
  }

  @External
  static pow(base: U256, exp: U256): void {
    const zero = U256Factory.fromString("0");
    const one = U256Factory.fromString("1");
    const two = U256Factory.fromString("2");
    let result: U256 = U256Factory.fromString("1");
    let b: U256 = base;
    let e: U256 = exp;
    while (e.greaterThan(zero)) {
      const modPow2 = e.mod(two);
      if (modPow2.equals(one)) {
        result = result.mul(b);
      }
      b = b.mul(b);
      e = e.div(two);
    }
    unsignedCounter = result;
  }

  @External
  static gcd(a: U256, b: U256): void {
    const zero = U256Factory.fromString("0");
    let x = a;
    let y = b;
    do {
      const tmp = y;
      y = x.mod(y);
      x = tmp;
    } while (!y.equals(zero));
    unsignedCounter = x;
  }

  @External
  static reset(): void {
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();
  }

  @External
  static resetToValues(unsignedValue: U256, signedValue: I256): void {
    unsignedCounter = unsignedValue;
    signedCounter = signedValue;
  }

  @External
  static forceU256Overflow(): void {
    const nearMax = U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639930",
    );
    unsignedCounter = nearMax;

    const increment = U256Factory.fromString("10");
    unsignedCounter = unsignedCounter.add(increment);
  }

  @External
  static forceU256Underflow(): void {
    unsignedCounter = U256Factory.fromString("5");

    const decrement = U256Factory.fromString("10");
    unsignedCounter = unsignedCounter.sub(decrement);
  }

  @External
  static forceI256Overflow(): void {
    const nearMaxPositive = I256Factory.fromString(
      "57896044618658097711785492504343953926634992332820282019728792003956564819960",
    );
    signedCounter = nearMaxPositive;

    const increment = I256Factory.fromString("20");
    signedCounter = signedCounter.add(increment);
  }

  @External
  static forceI256Underflow(): void {
    const nearMinNegative = I256Factory.fromString(
      "-57896044618658097711785492504343953926634992332820282019728792003956564819960",
    );
    signedCounter = nearMinNegative;
    const decrement = I256Factory.fromString("20");
    signedCounter = signedCounter.sub(decrement);
  }

  @External
  static testOverflowInLoop(): void {
    const one = U256Factory.fromString("1");
    const five = U256Factory.fromString("5");
    unsignedCounter = U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639933",
    );

    for (
      let iterator = U256Factory.create();
      iterator.lessThan(five);
      iterator = iterator.add(one)
    ) {
      // Overflow in iteration 3
      unsignedCounter = unsignedCounter.add(one);
    }
  }

  @External
  static testSignedOverflowInLoop(): void {
    const five = I256Factory.fromString("5");
    signedCounter = I256Factory.fromString(
      "57896044618658097711785492504343953926634992332820282019728792003956564819965",
    );

    let iterator = I256Factory.create();
    do {
      // Overflow in iteration 3
      signedCounter = signedCounter.add(I256Factory.fromString("1"));
      iterator = iterator.add(I256Factory.fromString("1"));
    } while (iterator.lessThan(five));
  }

  @View
  static getUnsigned(): U256 {
    return unsignedCounter.toString();
  }

  @View
  static getSigned(): I256 {
    return signedCounter.toString();
  }

  @View
  static isSignedNegative(): boolean {
    const isNegative: boolean = signedCounter.isNegative();
    return isNegative;
  }

  @View
  static getSum(): I256 {
    const signedOne = I256Factory.fromString("1");
    let result = signedCounter;

    let iterator = U256Factory.create();
    while (iterator.lessThan(unsignedCounter)) {
      result = result.add(signedOne);
      iterator = iterator.add(U256Factory.fromString("1"));
    }

    return result;
  }
}
