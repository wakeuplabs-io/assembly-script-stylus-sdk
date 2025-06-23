// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  value: U256;
}

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
  static myStruct: StructTest;

  static setStruct(to: Address, contents: Str, value: U256, flag: boolean, value2: U256) {
    StructContract.myStruct.to = to;
    StructContract.myStruct.contents = contents;
    StructContract.myStruct.value = value;
    StructContract.myStruct.flag = flag;
    StructContract.myStruct.value2 = value2;
  }

  @View
  static getStructTo(): Address {
    return StructContract.myStruct.to;
  }

  @View
  static getStructContents(): Str {
    return StructContract.myStruct.contents;
  }

  @View
  static getStructValue(): U256 {
    return StructContract.myStruct.value;
  }

  @View
  static getStructFlag(): boolean {
    return StructContract.myStruct.flag;
  }

  @View
  static getStructValue2(): U256 {
    return StructContract.myStruct.value2;
  }
}
