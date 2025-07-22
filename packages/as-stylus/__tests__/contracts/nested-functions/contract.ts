// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Struct
export class Person {
  name: Str;
  lastName: Str;
}

@Contract
export class NestedFunctions {
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
}
