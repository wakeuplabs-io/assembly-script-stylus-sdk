// @ts-nocheck  
import { Contract, External, View, Fallback, Receive, Payable, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class ReceiveFallbackReverseContract {
  totalReceived: U256;
  fallbackCalled: U256;

  constructor() {
    this.totalReceived = U256Factory.create();
    this.fallbackCalled = U256Factory.create();
  }

  @View
  getBalance(): U256 {
    return this.totalReceived;
  }

  @View
  getFallbackCount(): U256 {
    return this.fallbackCalled;
  }

  @External
  normalFunction(amount: U256): U256 {
    const two = U256Factory.fromString("2");
    return amount.mul(two);
  }

  // NOTICE: Receive function defined BEFORE Fallback (reverse order)
  @Receive
  @External
  @Payable
  receiveEther(): void {
    const value = U256Factory.fromString("1000000000000000000");
    const currentTotal = this.totalReceived;
    this.totalReceived = currentTotal.add(value);
  }

  @Fallback
  @External
  @Payable
  fallbackFunction(): void {
    const one = U256Factory.fromString("1");
    const currentCount = this.fallbackCalled;
    this.fallbackCalled = currentCount.add(one);
  }
}