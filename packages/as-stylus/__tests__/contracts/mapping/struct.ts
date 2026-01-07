import {
  Address,
  Contract,
  External,
  Mapping,
  Struct,
  StructFactory,
  StructTemplate,
  View,
  Str,
  U256,
} from "@wakeuplabs/as-stylus";

@StructTemplate
export class UserInfo {
  age: U256;
  to: Address;
  isActive: boolean;
  name: Str;
}

@Contract
export class MappingStruct {
  userInfo2: Struct<UserInfo>;
  users: Mapping<Address, UserInfo>;
  constructor() {}

  @External
  setUserData(name: Str, age: U256, isActive: boolean, to: Address): void {
    const other = StructFactory.create<UserInfo>({
      age: age,
      to: to,
      isActive: isActive,
      name: name,
    });
    this.users.set(to, other);
  }

  @View
  getUserInfo(to: Address): UserInfo {
    return this.users.get(to);
  }
}
