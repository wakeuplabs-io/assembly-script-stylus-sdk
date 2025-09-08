// @ts-nocheck
import { Contract, External, Receive, Payable, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class ReceiveOnlyContract {
  totalReceived: U256;

  constructor() {
    this.totalReceived = U256Factory.create();
  }

  @External
  getBalance(): U256 {
    return this.totalReceived;
  }

  @External
  normalFunction(amount: U256): U256 {
    const two = U256Factory.fromString("2");
    return amount.mul(two);
  }

  @Receive
  @External
  @Payable
  receiveEther(): void {
    const value = U256Factory.fromString("1000000000000000000");
    const currentTotal = this.totalReceived;
    this.totalReceived = currentTotal.add(value);
  }
}