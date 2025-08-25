// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class CallsContract {
  static owners: Mapping<U256, Address>;
  static myAddress: Address;

  constructor(address: Address) {
    myAddress = address;
    owners.set(U256Factory.fromString("1"), address);
  }

  @External
  static testCall(value: U256): void {
    const emptyData = StrFactory.fromString("");

    const oneKey = U256Factory.fromString("1");
    const ownerAddress = owners.get(oneKey);
    CallFactory.call(ownerAddress, value, emptyData);
  }

  @External
  static testDelegateCall(): void {
    const emptyData = StrFactory.fromString("");
    CallFactory.delegateCall(myAddress, emptyData);
  }

  /**
   * Test static call (read-only)
   */
  @External
  static testStaticCall(): void {
    const emptyData = StrFactory.fromString("");

    CallFactory.staticCall(myAddress, emptyData);
  }

  @External
  static testTransfer(value: U256): void {
    // Test: Transfer to owner instead of self-transfer to see if that works
    const oneKey = U256Factory.fromString("1");
    const ownerAddress = owners.get(oneKey);
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
  static testCallToOwner(value: U256): void {
    const oneKey = U256Factory.fromString("1");
    const ownerAddress = owners.get(oneKey);
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
  static setOwner(key: U256, owner: Address): void {
    owners.set(key, owner);
  }

  @View
  static getOwner(key: U256): Address {
    return owners.get(key);
  }

  @View
  static getMyAddress(): Address {
    return myAddress;
  }
}
