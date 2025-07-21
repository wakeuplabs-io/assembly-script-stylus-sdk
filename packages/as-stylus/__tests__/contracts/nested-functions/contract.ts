// @ts-nocheck

@Contract
export class NestedFunctions {
  // Boolean methods
  @Internal
  static toogle(arg: boolean): boolean {
    return !arg;
  }

  @External
  static getBooleanExternal(): boolean {
    return toogle(false) && !toogle(true);
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
    const sender = msg.sender;
    return getAddress(sender);
  }

  // Pasar por param una pos del struct persona.apellido
}
