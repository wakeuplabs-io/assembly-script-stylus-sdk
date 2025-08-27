// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Struct
export class User {
  // index: U256;
  // age: U256;
  // name: Str;
  // isActive: boolean;
  address: Address;
  owner: Address;
}

@Contract
export class FunctionCallArgsTest {
  user: Struct<User>;

  @External
  getAddress(): Address {
    return user.address;
  }

  @View
  @External
  getUser(): User {
    return user;
  }

  @External
  setAddress(addr: Address): void {
    user.address = addr;
    user.owner = msg.sender;
  }
}
