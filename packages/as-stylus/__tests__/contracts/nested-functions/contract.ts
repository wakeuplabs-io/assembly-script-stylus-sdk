// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class NestedFunctions {
  // State variables for complex operations
  static unsignedCounter: U256;
  static signedCounter: I256;
  static stepSize: U256;
  static negativeStepSize: I256;
  static maxIterations: U256;
  static owners: Mapping<U256, Address>;

  @Constructor
  static constructor(): void {
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();
    stepSize = U256Factory.fromString("5");
    negativeStepSize = I256Factory.fromString("-2");
    maxIterations = U256Factory.fromString("100");
  }

  // Boolean methods
  @Internal
  static toggle(arg: boolean): boolean {
    return !arg;
  }

  @External
  static getBooleanExternal(): boolean {
    return toggle(false) && !toggle(true);
  }

  // U256 methods
  @Internal
  static increment(value: U256): U256 {
    return value.add(U256Factory.fromString("1"));
  }

  @External
  static getIncremented(value: U256): U256 {
    return increment(value);
  }

  @External
  static incrementThreeTimes(value: U256): U256 {
    return increment(increment(increment(value)));
  }

  // Str methods
  @Internal
  static getString(arg: Str): Str {
    return arg;
  }

  @External
  static getStringExternal(): Str {
    const arg = StrFactory.fromString("Hello, world!");
    const result = getString(arg);
    return result;
  }

  // Address methods
  @Internal
  static getAddress(arg: Address): Address {
    return arg;
  }

  @External
  static getAddressExternal(): Address {
    const sender = AddressFactory.fromString("0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E");
    return sender;
  }

  // Complex loop operations with inline literals (no const declarations)
  @External
  static tripleIncrement(): void {
    let iterator = U256Factory.create();
    do {
      unsignedCounter = unsignedCounter.add(stepSize);
      iterator = iterator.add(U256Factory.fromString("1"));
    } while (iterator.lessThan(U256Factory.fromString("3")));

    let iterator2 = I256Factory.create();
    do {
      signedCounter = signedCounter.add(I256Factory.fromString("1"));
      iterator2 = iterator2.add(I256Factory.fromString("1"));
    } while (iterator2.lessThan(I256Factory.fromString("3")));
  }

  @External
  static bulkIncrement(times: U256): void {
    let iterator = U256Factory.create();
    let actualTimes = times;
    if (times.greaterThan(maxIterations)) {
      actualTimes = maxIterations;
    }

    while (iterator.lessThan(actualTimes)) {
      unsignedCounter = unsignedCounter.add(stepSize);

      if (iterator.lessThan(U256Factory.fromString("2"))) {
        signedCounter = signedCounter.add(I256Factory.fromString("1"));
      } else {
        signedCounter = signedCounter.add(negativeStepSize);
      }

      iterator = iterator.add(U256Factory.fromString("1"));
    }
  }

  @External
  static complexCalculation(baseValue: U256): U256 {
    let result = baseValue;
    let multiplier = U256Factory.create();
    
    // Use predefined constants to avoid dynamic string creation in loop
    const zero = U256Factory.fromString("0");
    const one = U256Factory.fromString("1");
    const two = U256Factory.fromString("2");
    const three = U256Factory.fromString("3");
    const five = U256Factory.fromString("5");
    const seven = U256Factory.fromString("7");
    const ten = U256Factory.fromString("10");
    
    // Complex nested operation with optimized constants
    while (multiplier.lessThan(five)) {
      if (multiplier.equals(zero)) {
        result = result.add(ten);
      } else if (multiplier.equals(one)) {
        result = result.mul(two);
      } else if (multiplier.equals(two)) {
        result = result.sub(three);
      } else if (multiplier.equals(three)) {
        result = result.div(two);
      } else {
        result = result.add(seven);
      }
      multiplier = multiplier.add(one);
    }
    
    return result;
  }

  // Getters for state variables
  @View
  static getUnsignedCounter(): U256 {
    return unsignedCounter;
  }

  @View
  static getSignedCounter(): I256 {
    return signedCounter;
  }

  // Simple stress test with moderate complexity (removed extreme recursion functions)
  @External
  static moderateComplexityTest(input: U256): U256 {
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

  // Reset functions for testing
  @External
  static resetCounters(): void {
    unsignedCounter = U256Factory.create();
    signedCounter = I256Factory.create();
  }

  @View
  static ownerOf(tokenId: U256): Address {
    const isZero = owners.get(tokenId).isZero();
    if (isZero) return AddressFactory.create();
    return owners.get(tokenId);
  }
}
