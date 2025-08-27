import {
  Contract,
  Internal,
  U256,
  U256Factory,
  I256,
  I256Factory,
  Mapping,
  Address,
  AddressFactory,
  External,
  Str,
  StrFactory,
  View,
} from "as-stylus";

@Contract
export class NestedFunctions {
  unsignedCounter: U256;
  signedCounter: I256;
  stepSize: U256;
  negativeStepSize: I256;
  maxIterations: U256;
  owners: Mapping<U256, Address> = new Mapping<U256, Address>();

  constructor() {
    this.unsignedCounter = U256Factory.create();
    this.signedCounter = I256Factory.create();
    this.stepSize = U256Factory.fromString("5");
    this.negativeStepSize = I256Factory.fromString("-2");
    this.maxIterations = U256Factory.fromString("100");
  }

  @Internal
  toggle(arg: boolean): boolean {
    return !arg;
  }

  @External
  getBooleanExternal(): boolean {
    return this.toggle(false) && !this.toggle(true);
  }

  @Internal
  increment(value: U256): U256 {
    return value.add(U256Factory.fromString("1"));
  }

  @External
  getIncremented(value: U256): U256 {
    return this.increment(value);
  }

  @External
  incrementThreeTimes(value: U256): U256 {
    return this.increment(this.increment(this.increment(value)));
  }

  @Internal
  getString(arg: Str): Str {
    return arg;
  }

  @External
  getStringExternal(): Str {
    const arg = StrFactory.fromString("Hello, world!");
    const result = this.getString(arg);
    return result;
  }

  @Internal
  getAddress(arg: Address): Address {
    return arg;
  }

  @External
  getAddressExternal(): Address {
    const sender = AddressFactory.fromString("0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E");
    return sender;
  }

  @External
  tripleIncrement(): void {
    let iterator = U256Factory.create();
    do {
      this.unsignedCounter = this.unsignedCounter.add(this.stepSize);
      iterator = iterator.add(U256Factory.fromString("1"));
    } while (iterator.lessThan(U256Factory.fromString("3")));

    let iterator2 = I256Factory.create();
    do {
      this.signedCounter = this.signedCounter.add(I256Factory.fromString("1"));
      iterator2 = iterator2.add(I256Factory.fromString("1"));
    } while (iterator2.lessThan(I256Factory.fromString("3")));
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

      if (iterator.lessThan(U256Factory.fromString("2"))) {
        this.signedCounter = this.signedCounter.add(I256Factory.fromString("1"));
      } else {
        this.signedCounter = this.signedCounter.add(this.negativeStepSize);
      }

      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }

  @External
  complexCalculation(baseValue: U256): U256 {
    let result = baseValue;
    let multiplier = U256Factory.create();

    // Mix of constants and nested calls to demonstrate both patterns
    const zero = U256Factory.fromString("0");
    const one = U256Factory.fromString("1");
    const two = U256Factory.fromString("2");
    const three = U256Factory.fromString("3");

    while (multiplier.lessThan(U256Factory.fromString("5"))) {
      if (multiplier.equals(zero)) {
        // Nested factory call inside method call
        result = result.add(U256Factory.fromString("10"));
      } else if (multiplier.equals(one)) {
        result = result.mul(two);
      } else if (multiplier.equals(U256Factory.fromString("2"))) {
        result = result.sub(three);
      } else if (multiplier.equals(U256Factory.fromString("3"))) {
        // Nested factory call in div operation
        result = result.div(U256Factory.fromString("2"));
      } else {
        // Multiple nested calls - this is the key test case
        result = result.add(U256Factory.fromString("7"));
      }
      multiplier = multiplier.add(U256Factory.fromString("1"));
    }

    return result;
  }

  @View
  getUnsignedCounter(): U256 {
    return this.unsignedCounter;
  }

  @View
  getSignedCounter(): I256 {
    return this.signedCounter;
  }

  @External
  moderateComplexityTest(input: U256): U256 {
    let result = input;
    let counter = U256Factory.create();

    while (counter.lessThan(U256Factory.fromString("2"))) {
      const ten = U256Factory.fromString("10");
      if (result.greaterThan(ten)) {
        const five = U256Factory.fromString("5");
        const multiplier = U256Factory.fromString("2").add(counter);
        const increment = five.mul(multiplier);
        result = result.add(increment);
      } else {
        const three = U256Factory.fromString("3");
        const divisor = U256Factory.fromString("2");
        result = result.mul(three).div(divisor);
      }

      counter = counter.add(U256Factory.fromString("1"));
    }

    return result;
  }

  @External
  resetCounters(): void {
    this.unsignedCounter = U256Factory.create();
    this.signedCounter = I256Factory.create();
  }

  @View
  ownerOf(tokenId: U256): Address {
    const isZero = this.owners.get(tokenId).isZero();
    if (isZero) return AddressFactory.create();
    return this.owners.get(tokenId);
  }
}
