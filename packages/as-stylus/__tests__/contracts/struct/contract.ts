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
}
