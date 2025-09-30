import {
  Address,
  Contract,
  External,
  StrFactory,
  CallFactory,
  Str,
  U256,
  U256Factory,
} from "@wakeuplabs/as-stylus";

@Contract
export class CallsContract {
  contractAddress: Address;

  constructor(address: Address) {
    this.contractAddress = address;
  }

  @External
  testStaticCall(): Str {
    const data = StrFactory.fromString("0x6d4ce63c");

    const v = CallFactory.staticCall(this.contractAddress, data);
    return v;
  }
}
