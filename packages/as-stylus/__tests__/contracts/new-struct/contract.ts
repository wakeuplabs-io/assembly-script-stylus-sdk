import {
  Address,
  Contract,
  External,
  msg,
  Str,
  Struct,
  StructFactory,
  StructTemplate,
  U256,
  View,
} from "@wakeuplabs/as-stylus";

@StructTemplate
export class User {
  address!: Address;
  owner!: Address;
  name!: Str;
  lastName!: Str;
  age!: U256;
  isActive!: boolean;
}

@Contract
export class Market {
  buyer: Struct<User>;
  seller: Struct<User>;

  @External
  getBuyerAddress(): Address {
    return this.buyer.address;
  }

  @External
  getSellerAddress(): Address {
    return this.seller.address;
  }

  @View
  @External
  getBuyer(): User {
    const temp = StructFactory.create<User>({
      address: this.buyer.address,
      owner: this.buyer.owner,
      name: this.buyer.name,
      lastName: this.buyer.lastName,
      age: this.buyer.age,
      isActive: this.buyer.isActive,
    });
    return temp;
  }

  @View
  @External
  getSeller(): User {
    const temp = StructFactory.create<User>({
      address: this.seller.address,
      owner: this.seller.owner,
      name: this.seller.name,
      lastName: this.seller.lastName,
      age: this.seller.age,
      isActive: this.seller.isActive,
    });
    return temp;
  }

  @External
  setBuyerAddress(addr: Address): void {
    this.buyer.address = addr;
    this.buyer.owner = msg.sender;
  }

  @External
  setSellerAddress(addr: Address): void {
    this.seller.address = addr;
    this.seller.owner = msg.sender;
  }

  @External
  setBuyer(addr: Address, name: Str, lastName: Str, age: U256, isActive: boolean): void {
    this.buyer.address = addr;
    this.buyer.owner = msg.sender;
    this.buyer.name = name;
    this.buyer.lastName = lastName;
    this.buyer.age = age;
    this.buyer.isActive = isActive;
  }

  @External
  setSeller(addr: Address, name: Str, lastName: Str, age: U256, isActive: boolean): void {
    this.seller.address = addr;
    this.seller.owner = msg.sender;
    this.seller.name = name;
    this.seller.lastName = lastName;
    this.seller.age = age;
    this.seller.isActive = isActive;
  }
}
