// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import {
  Address,
  Contract,
  Mapping,
  U256,
  View,
  External,
  U256Factory,
  StrFactory,
  CallFactory,
} from "as-stylus";

@Contract
export class CallsContract {
  owners: Mapping<U256, Address> = new Mapping<U256, Address>();
  contractAddress: Address;

  constructor(address: Address) {
    this.contractAddress = address;
    this.owners.set(U256Factory.fromString("1"), address);
  }

  @External
  testCall(value: U256): void {
    const emptyData = StrFactory.fromString("");

    const oneKey = U256Factory.fromString("1");
    const ownerAddress = this.owners.get(oneKey);
    CallFactory.call(ownerAddress, value, emptyData);
  }

  @External
  testDelegateCall(): void {
    const emptyData = StrFactory.fromString("");
    CallFactory.delegateCall(this.contractAddress, emptyData);
  }

  /**
   * Test static call (read-only)
   */
  @External
  testStaticCall(): void {
    const emptyData = StrFactory.fromString("");

    CallFactory.staticCall(this.contractAddress, emptyData);
  }

  @External
  testTransfer(value: U256): void {
    // Test: Transfer to owner instead of self-transfer to see if that works
    const oneKey = U256Factory.fromString("1");
    const ownerAddress = this.owners.get(oneKey);
    CallFactory.transfer(ownerAddress, value);
  }

  /**
   * Test send helper - Send 1 wei to myAddress (returns bool directly)
   */
  // @External
  // static testSend(): boolean {
  //   const oneWei = U256Factory.fromString("1");

  //   return CallFactory.send(myAddress, oneWei);
  // }

  /**
   * Test call to owner address - Send 1 wei to owners.get(1)
   */
  @External
  testCallToOwner(value: U256): void {
    const oneKey = U256Factory.fromString("1");
    const ownerAddress = this.owners.get(oneKey);
    const emptyData = StrFactory.fromString("");

    CallFactory.call(ownerAddress, value, emptyData);
  }

  /**
   * Test send to owner address - Send 1 wei to owners.get(1)
   */
  // @External
  // static testSendToOwner(): boolean {
  //   const oneKey = U256Factory.fromString("1");
  //   const ownerAddress = owners.get(oneKey);
  //   const oneWei = U256Factory.fromString("1");

  //   return CallFactory.send(ownerAddress, oneWei);
  // }

  @External
  setOwner(key: U256, owner: Address): void {
    this.owners.set(key, owner);
  }

  @View
  getOwner(key: U256): Address {
    return this.owners.get(key);
  }

  @View
  getMyAddress(): Address {
    return this.contractAddress;
  }
}
