import {
  Address,
  Str,
  U256,
  Contract,
  External,
  StructFactory,
  StructTemplate,
} from "@wakeuplabs/as-stylus";

@StructTemplate
export class StructTest {
  to: Address;
  contents: Str;
  value: U256;
  flag: boolean;
  value2: U256;
}

@Contract
export class OnlyMemoryStruct {
  @External
  getStruct(to: Address, contents: Str, value: U256, flag: boolean, value2: U256): StructTest {
    const struct = StructFactory.create<StructTest>({
      to: to,
      contents: contents,
      value: value,
      flag: flag,
      value2: value2,
    });
    return struct;
  }

  @View
  getIncreasedValue(
    to: Address,
    contents: Str,
    value: U256,
    flag: boolean,
    value2: U256,
    amount: U256,
  ): U256 {
    const struct = StructFactory.create<StructTest>({
      to: to,
      contents: contents,
      value: value,
      flag: flag,
      value2: value2,
    });
    return struct.value.add(amount);
  }
}
