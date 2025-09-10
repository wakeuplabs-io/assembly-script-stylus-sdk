// @ts-nocheck
import { Contract, External, Fallback, Payable, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class FallbackOnlyContract {
  fallbackCalled: U256;

  constructor() {
    this.fallbackCalled = U256Factory.create();
  }

  @External
  getFallbackCount(): U256 {
    return this.fallbackCalled;
  }

  @External
  normalFunction(amount: U256): U256 {
    const two = U256Factory.fromString("2");
    return amount.mul(two);
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