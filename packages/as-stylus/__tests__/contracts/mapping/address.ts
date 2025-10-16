import {
  Address,
  Contract,
  External,
  I256,
  I256Factory,
  Mapping,
  U256,
  View,
  AddressFactory,
} from "@wakeuplabs/as-stylus";

@Contract
export class MappingAddress {
  //ids: Mapping<Address, I256> = new Mapping<Address, I256>();
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  //enabled: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  //otherAddress: Mapping<Address, Address> = new Mapping<Address, Address>();

  constructor() {}

  @External
  set(address: Address, value: U256, _enabled: boolean, otherAddress: Address, _id: I256): void {
    //this.ids.set(address, id);
    //this.enabled.set(address, enabled);
    this.balances.set(address, value);
    //this.otherAddress.set(address, otherAddress);
  }

  @External
  getEnabled(_address: Address): boolean {
    //return this.enabled.get(address);
    return true;
  }

  @View
  getBalance(address: Address): U256 {
    return this.balances.get(address);
  }

  @View
  getOtherAddress(address: Address): Address {
    //return this.otherAddress.get(address);
    //return this.otherAddress.get(address);
    return AddressFactory.fromString("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  }

  @View
  getIds(_address: Address): I256 {
    //return this.ids.get(address);
    return I256Factory.fromString("100");
  }
}
