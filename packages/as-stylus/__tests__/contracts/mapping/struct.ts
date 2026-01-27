import {
  Address,
  Contract,
  External,
  Mapping,
  StructFactory,
  StructTemplate,
  View,
  Str,
  U256,
  U256Factory,
  Struct,
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
  user: Struct<UserInfo>;
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

  @External
  incrementAge(to: Address): void {
    const user = this.users.get(to);
    user.age = user.age.add(U256Factory.fromString("1"));
    this.users.set(to, user);
  }
}
