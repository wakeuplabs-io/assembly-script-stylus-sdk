// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Struct
export class StructTest {
  to: Address;
  contents: Str;
  value: U256;
  flag: boolean;
  value2: U256;
}

@Contract
export class StructContract {
  static myStruct: Struct<StructTest>;
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static isEnabled: boolean;

  @External
  static setStruct(to: Address, contents: Str, value: U256, flag: boolean, value2: U256) {
    myStruct.to = to;
    myStruct.contents = contents;
    myStruct.value = value;
    myStruct.flag = flag;
    myStruct.value2 = value2;
  }

  @View
  static getStructTo(): Address {
    return myStruct.to;
  }

  @View
  static getStructContents(): Str {
    return myStruct.contents;
  }

  @View
  static getStructValue(): U256 {
    return myStruct.value;
  }

  @View
  static getStructFlag(): boolean {
    return myStruct.flag;
  }

  @View
  static getStructValue2(): U256 {
    return myStruct.value2;
  }

  @View
  static getInfo(): StructTest {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    const tempValue = structTemp.value;
    structTemp.value2 = tempValue;
    const delta: U256 = U256Factory.fromString("1");
    structTemp.value = tempValue.add(delta);
    return structTemp;
  }

  @View
  static getProcessedStructTo(): Address {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    return structTemp.to;
  }

  @View
  static getProcessedStructContents(): Str {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    return structTemp.contents;
  }

  @View
  static getProcessedStructValue(): U256 {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    const tempValue = structTemp.value;
    const delta: U256 = U256Factory.fromString("1");
    structTemp.value = tempValue.add(delta);
    return structTemp.value;
  }

  @View
  static getProcessedStructFlag(): boolean {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    return structTemp.flag;
  }

  @View
  static getProcessedStructValue2(): U256 {
    const toAddr = myStruct.to;
    const contents = myStruct.contents;
    const valueMemory = myStruct.value;
    const flag = myStruct.flag;
    const value2Memory = myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    const tempValue = structTemp.value;
    structTemp.value2 = tempValue;
    return structTemp.value2;
  }
}
