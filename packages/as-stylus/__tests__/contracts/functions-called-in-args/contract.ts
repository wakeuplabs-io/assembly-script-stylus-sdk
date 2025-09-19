import {
  StructTemplate,
  U256,
  U256Factory,
  I256,
  I256Factory,
  Str,
  StrFactory,
  Address,
  Contract,
  Struct,
  Mapping,
  Internal,
  StructFactory,
  External,
  View,
  msg,
} from "@wakeuplabs/as-stylus";

@StructTemplate
export class User {
  index: U256;
  age: U256;
  isActive: boolean;
  address: Address;
}

@StructTemplate
export class AllViewResults {
  u256Value: U256;
  i256Value: I256;
  boolValue: boolean;
  addrValue: Address;
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
    const tempUser = StructFactory.create<User>({
      index: this.getU256(),
      age: this.getU256(),
      isActive: this.getBool(),
      address: this.getAddr(msg.sender),
    });
    return tempUser;
  }

  @External
  testU256InArg(): void {
    this.u256Value = this.getU256().add(U256Factory.fromString("100"));
  }

  @External
  testI256InArg(): void {
    this.i256Value = this.getI256().add(I256Factory.fromString("20"));
  }

  @External
  testBoolInIf(): void {
    if (this.getBool()) {
      this.boolValue = true;
    }
  }

  @External
  testAddrInMapping(): void {
    this.balances.set(this.getAddr(msg.sender), this.getU256());
  }

  @External
  testStructInStorage(): void {
    this.user = StructFactory.create<User>({
      index: this.getU256(),
      age: this.getU256(),
      isActive: this.getBool(),
      address: this.getAddr(msg.sender),
    });
  }

  @External
  testFuncInFuncCall(): void {
    this.u256Value = this.getU256().add(this.getU256().mul(U256Factory.fromString("2")));
  }

  @External
  testFunctionAsParameter(str: Str, u256: U256, addr: Address): void {
    this.strValue = str;
    this.u256Value = u256;
    this.addrValue = addr;
  }

  @External
  testFunctionCallAsParameter(): void {
    this.testFunctionAsParameter(this.getStr(), this.getU256(), this.getAddr(msg.sender));
  }

  @View
  getStrValue(): Str {
    return this.strValue;
  }

  @View
  getU256Value(): U256 {
    return this.u256Value;
  }

  @View
  getI256Value(): I256 {
    return this.i256Value;
  }

  @View
  getBoolValue(): boolean {
    return this.boolValue;
  }

  @View
  getAddrValue(): Address {
    return this.addrValue;
  }

  @External
  setAddress(addr: Address): void {
    this.addrValue = addr;
  }

  @External
  setUser(age: U256, index: U256, isActive: boolean, address: Address): void {
    this.user.age = age;
    this.user.index = index;
    this.user.isActive = isActive;
    this.user.address = address;
  }

  @View
  getUserExternal(): User {
    return this.user;
  }

  @View
  getBalance(addr: Address): U256 {
    return this.balances.get(addr);
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
    const structTemp = StructFactory.create<AllViewResults>({
      u256Value: u256,
      i256Value: i256,
      boolValue: bool,
      addrValue: addr,
      balance: balance,
    });

    return structTemp;
  }

  @View
  getAllViewResults(addr: Address): AllViewResults {
    const structTemp = this.createResult(
      this.getStrValue(),
      this.getU256Value(),
      this.getI256Value(),
      this.getBoolValue(),
      this.getAddrValue(),
      this.getBalance(addr),
    );

    return structTemp;
  }
}
