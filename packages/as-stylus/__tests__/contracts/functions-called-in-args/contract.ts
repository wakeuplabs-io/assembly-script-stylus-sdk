// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Struct
export class UserData {
  name: Str;
  age: U256;
  isActive: boolean;
}

@Event
export class ValuesSet {
  @Indexed stringValue: Str;
  @Indexed numberValue: U256;
  @Indexed booleanValue: boolean;
  address: Address;
}

@Error
export class InvalidOperation {
  operation: Str;
  reason: Str;
}

@Contract
export class FunctionsInArgsTest {
  static booleanStorage: boolean;
  static u256Storage: U256;
  static i256Storage: I256;
  static stringStorage: Str;
  static addressStorage: Address;
  static userData: Struct<UserData>;

  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static userProfiles: Mapping<U256, UserData> = new Mapping<U256, UserData>();

  constructor() {
    booleanStorage = false;
    u256Storage = U256Factory.create();
    i256Storage = I256Factory.create();
    stringStorage = StrFactory.fromString("initial");
    addressStorage = msg.sender;

    userData.name = StrFactory.fromString("default");
    userData.age = U256Factory.create();
    userData.isActive = false;

    balances.set(msg.sender, U256Factory.fromString("1000"));
  }

  @Internal
  static getCalculatedNumber(): U256 {
    return U256Factory.fromString("1000");
  }

  @Internal
  static getBooleanTrue(): boolean {
    return true;
  }

  @Internal
  static getBooleanFalse(): boolean {
    return false;
  }

  @Internal
  static getCalculatedBoolean(): boolean {
    return !booleanStorage;
  }

  @Internal
  static getSmallNumber(): U256 {
    return U256Factory.fromString("42");
  }

  @Internal
  static getLargeNumber(): U256 {
    return U256Factory.fromString("999999");
  }

  @Internal
  static getAddedNumbers(): U256 {
    const a = getSmallNumber();
    const b = U256Factory.fromString("8");
    return a.add(b);
  }

  @Internal
  static getNegativeNumber(): I256 {
    return I256Factory.fromString("-100");
  }

  @Internal
  static getPositiveI256(): I256 {
    return I256Factory.fromString("200");
  }

  @Internal
  static getCalculatedI256(): I256 {
    const negative = getNegativeNumber();
    const positive = getPositiveI256();
    return negative.add(positive);
  }

  @Internal
  static getShortString(): Str {
    return StrFactory.fromString("Hello");
  }

  @Internal
  static getLongString(): Str {
    return StrFactory.fromString("This is a very long string for testing purposes");
  }

  @Internal
  static getConcatenatedString(): Str {
    /*
    const part1 = getShortString();
    const part2 = StrFactory.fromString(" World!");
    return part1.concat(part2);
    */
    return StrFactory.fromString("Hello World!");
  }

  @Internal
  static getSenderAddress(): Address {
    return msg.sender;
  }

  @Internal
  static getZeroAddress(): Address {
    return AddressFactory.fromString("0x0000000000000000000000000000000000000000");
  }

  @Internal
  static getTestAddress(): Address {
    return AddressFactory.fromString("0x1234567890123456789012345678901234567890");
  }

  @Internal
  static createUserData(): UserData {
    user.name = getConcatenatedString();
    user.age = getCalculatedNumber();
    user.isActive = getBooleanTrue();
    return user;
  }

  @External
  static testBooleanFunctionArgs(): void {
    booleanStorage = getBooleanTrue();

    const result = !getCalculatedBoolean();
    booleanStorage = result;
  }

  @External
  static testU256FunctionArgs(): void {
    u256Storage = getCalculatedNumber();

    const sum = getSmallNumber().add(getLargeNumber());
    u256Storage = sum;

    const product = getAddedNumbers().mul(getSmallNumber());
    u256Storage = product;
  }

  @External
  static testI256FunctionArgs(): void {
    i256Storage = getCalculatedI256();

    const difference = getPositiveI256().sub(getNegativeNumber());
    i256Storage = difference;
  }

  @External
  static testStringFunctionArgs(): void {
    stringStorage = getConcatenatedString();

    const doubled = getConcatenatedString().concat(getShortString());
    stringStorage = doubled;
  }

  @External
  static testAddressFunctionArgs(): void {
    addressStorage = getSenderAddress();

    balances.set(getTestAddress(), getCalculatedNumber());

    const isZero = addressStorage.equals(getZeroAddress());
    booleanStorage = isZero;
  }

  @External
  static testStructFunctionArgs(): void {
    userData = createUserData();

    userData.name = getConcatenatedString();
    userData.age = getAddedNumbers();
    userData.isActive = getCalculatedBoolean();
  }

  @External
  static testMappingFunctionArgs(): void {
    balances.set(getSenderAddress(), getCalculatedNumber());

    const balance = balances.get(getTestAddress());
    u256Storage = balance;

    balances.set(getZeroAddress(), getSmallNumber().add(getLargeNumber()));
  }

  @External
  static testEventFunctionArgs(): void {
    ValuesSet.emit(
      getConcatenatedString(),
      getCalculatedNumber(),
      getBooleanTrue(),
      getSenderAddress(),
    );
  }

  @External
  static testErrorFunctionArgs(): void {
    InvalidOperation.revert(getShortString(), getConcatenatedString());
  }

  @External
  static testNestedFunctionCalls(): void {
    const nested1 = getCalculatedNumber().add(getAddedNumbers());
    const nested2 = getConcatenatedString().concat(getLongString());
    const nested3 = getCalculatedI256().add(getNegativeNumber());

    u256Storage = nested1;
    stringStorage = nested2;
    i256Storage = nested3;
  }

  @External
  static testComplexFunctionArgs(): void {
    const sender = getSenderAddress();
    const recipient = getTestAddress();
    const amount = getCalculatedNumber();

    const senderBalance = balances.get(sender);
    if (senderBalance.gte(amount)) {
      balances.set(sender, senderBalance.sub(amount));
      balances.set(recipient, balances.get(recipient).add(amount));
    }

    ValuesSet.emit(getLongString(), getAddedNumbers(), getCalculatedBoolean(), getTestAddress());
  }

  @External
  static testConditionalFunctionArgs(): void {
    const condition = getBooleanTrue();

    if (condition) {
      u256Storage = getSmallNumber();
    } else {
      u256Storage = getLargeNumber();
    }

    booleanStorage = getBooleanTrue() ? getCalculatedBoolean() : getBooleanFalse();

    const complexCondition = getBooleanTrue() && !getBooleanFalse();
    if (complexCondition) {
      stringStorage = getConcatenatedString();
    }
  }

  @View
  static getBooleanStorage(): boolean {
    return booleanStorage;
  }

  @View
  static getU256Storage(): U256 {
    return u256Storage;
  }

  @View
  static getI256Storage(): I256 {
    return i256Storage;
  }

  @View
  static getStringStorage(): Str {
    return stringStorage;
  }

  @View
  static getAddressStorage(): Address {
    return addressStorage;
  }

  @View
  static getUserData(): UserData {
    return userData;
  }

  @View
  static getBalance(address: Address): U256 {
    return balances.get(address);
  }

  @View
  static verifySmallNumber(): U256 {
    return getSmallNumber();
  }

  @View
  static verifyConcatenatedString(): Str {
    return getConcatenatedString();
  }

  @View
  static verifyCalculatedBoolean(): boolean {
    return getCalculatedBoolean();
  }
}
