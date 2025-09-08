// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Struct
export class User {
  index: U256;
  age: U256;
  // name: Str;
  isActive: boolean;
  address: Address;
}

@Struct
export class AllViewResults {
  strValue: Str;
  u256Value: U256;
  i256Value: I256;
  boolValue: boolean;
  addrValue: Address;
  user: User;
  balance: U256;
}

@Contract
export class FunctionCallArgsTest {
  strValue: Str;
  u256Value: U256;
  i256Value: I256;
  boolValue: boolean;
  addrValue: Address;
  user: Struct<User>;
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();

  @Internal
  getStr(): Str {
    return StrFactory.fromString("abc");
  }

  @Internal
  getU256(): U256 {
    return U256Factory.fromString("42");
  }

  @Internal
  getI256(): I256 {
    return I256Factory.fromString("-10");
  }

  @Internal
  getBool(): boolean {
    return true;
  }

  @Internal
  getAddr(user: Address): Address {
    return user;
  }

  @Internal
  getUser(): User {
    const tempUser = StructFactory.create<User>([getStr(), getU256()]);
    return tempUser;
  }

  @External
  testU256InArg(): void {
    u256Value = getU256().add(U256Factory.fromString("100"));
  }

  @External
  testI256InArg(): void {
    i256Value = getI256().add(I256Factory.fromString("20"));
  }

  @External
  testBoolInIf(): void {
    if (getBool()) {
      boolValue = true;
    }
  }

  @External
  testAddrInMapping(): void {
    balances.set(getAddr(msg.sender), getU256());
  }

  @External
  testStructInStorage(): void {
    user = StructFactory.create<User>([getStr(), getU256()]);
  }

  @External
  testFuncInFuncCall(): void {
    u256Value = getU256().add(getU256().mul(U256Factory.fromString("2")));
  }

  @External
  testFunctionAsParameter(str: Str, u256: U256, addr: Address): void {
    strValue = str;
    u256Value = u256;
    addrValue = addr;
  }

  @External
  testFunctionCallAsParameter(): void {
    testFunctionAsParameter(getStr(), getU256(), getAddr(msg.sender));
  }

  @View
  getStrValue(): Str {
    return strValue;
  }

  @View
  getU256Value(): U256 {
    return u256Value;
  }

  @View
  getI256Value(): I256 {
    return i256Value;
  }

  @View
  getBoolValue(): boolean {
    return boolValue;
  }

  @View
  getAddrValue(): Address {
    return addrValue;
  }

  @External
  setAddress(addr: Address): void {
    addrValue = addr;
  }

  @External
  setUser(age: U256, index: U256, isActive: boolean, address: Address): void {
    user.age = age;
    user.index = index;
    user.isActive = isActive;
    user.address = address;
  }

  @View
  getUserExternal(): User {
    return user;
  }

  @View
  getBalance(addr: Address): U256 {
    return balances.get(addr);
  }

  @Internal
  createResult(
    str: Str,
    u256: U256,
    i256: I256,
    bool: boolean,
    addr: Address,
    balance: U256,
  ): AllViewResults {
    const structTemp = StructFactory.create<AllViewResults>([str, u256, i256, bool, addr, balance]);

    return structTemp;
  }

  @View
  getAllViewResults(addr: Address): AllViewResults {
    const structTemp = createResult(
      getStrValue(),
      getU256Value(),
      getI256Value(),
      getBoolValue(),
      getAddrValue(),
      getBalance(addr),
    );

    return structTemp;
  }
}
