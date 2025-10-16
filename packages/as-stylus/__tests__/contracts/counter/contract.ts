import { Contract, External, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

const zero = U256Factory.fromString("0");

@Contract
export class Counter {
  counter: U256;

  constructor() {
    this.counter = zero;
  }

  @External
  set(value: U256): void {
    this.counter = value;
  }

  @External
  increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    this.counter = this.counter.addUnchecked(delta);
  }

  @External
  decrement(): void {
    const delta: U256 = U256Factory.fromString("1");
    this.counter = this.counter.subUnchecked(delta);
  }

  @View
  get(): U256 {
    return this.counter;
  }
}
