import { Address, Contract, External, msg, Str, Struct, U256, View } from "as-stylus";

@Struct
export class User {
  address!: Address;
  owner!: Address;
  name!: Str;
  lastName!: Str;
  age!: U256;
  isActive!: boolean;
}

@Contract
export class FunctionCallArgsTest {
  user: Struct<User>;

  @External
  getAddress(): Address {
    return this.user.address;
  }

  @View
  @External
  getUser(): User {
    const temp = StructFactory.create<User>([
      this.user.address,
      this.user.owner,
      this.user.name,
      this.user.lastName,
      this.user.age,
      this.user.isActive,
    ]);
    return temp;
  }

  @External
  setAddress(addr: Address): void {
    this.user.address = addr;
    this.user.owner = msg.sender;
  }

  @External
  setUser(addr: Address, name: Str, lastName: Str, age: U256, isActive: boolean): void {
    this.user.address = addr;
    this.user.owner = msg.sender;
    this.user.name = name;
    this.user.lastName = lastName;
    this.user.age = age;
    this.user.isActive = isActive;
  }
}
