import {
  Address,
  Str,
  U256,
  Struct,
  Contract,
  External,
  View,
  Mapping,
  StructFactory,
  U256Factory,
} from "as-stylus";

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
  myStruct: Struct<StructTest>;
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  isEnabled: boolean;

  @External
  setStruct(to: Address, contents: Str, value: U256, flag: boolean, value2: U256) {
    this.myStruct.to = to;
    this.myStruct.contents = contents;
    this.myStruct.value = value;
    this.myStruct.flag = flag;
    this.myStruct.value2 = value2;
  }

  @View
  getStructTo(): Address {
    return this.myStruct.to;
  }

  @View
  getStructContents(): Str {
    return this.myStruct.contents;
  }

  @View
  getStructValue(): U256 {
    return this.myStruct.value;
  }

  @View
  getStructFlag(): boolean {
    return this.myStruct.flag;
  }

  @View
  getStructValue2(): U256 {
    return this.myStruct.value2;
  }

  @View
  getInfo(): StructTest {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
    const structTemp = StructFactory.create<StructTest>([
      toAddr,
      contents,
      valueMemory,
      flag,
      value2Memory,
    ]);
    return structTemp;
  }

  @View
  getProcessedStructTo(): Address {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
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
  getProcessedStructContents(): Str {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
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
  getProcessedStructValue(): U256 {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
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
  getProcessedStructFlag(): boolean {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
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
  getProcessedStructValue2(): U256 {
    const toAddr = this.myStruct.to;
    const contents = this.myStruct.contents;
    const valueMemory = this.myStruct.value;
    const flag = this.myStruct.flag;
    const value2Memory = this.myStruct.value2;
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
