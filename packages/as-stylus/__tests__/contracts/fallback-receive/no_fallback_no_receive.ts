import { Contract, External, View, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class NoFallbackNoReceiveContract {
  counter: U256;

  constructor() {
    this.counter = U256Factory.create();
  }

  @View
  getCounter(): U256 {
    return this.counter;
  }

  @External
  normalFunction(amount: U256): U256 {
    const two = U256Factory.fromString("2");
    return amount.mul(two);
  }

  @External
  increment(): void {
    const one = U256Factory.fromString("1");
    const currentCount = this.counter;
    this.counter = currentCount.add(one);
  }
}
