export function getCounterTemplate(): string {
  return `
import { Contract, External, U256, U256Factory, View } from "as-stylus";

@Contract
export class Counter {
  counter: U256;

  constructor() {
    this.counter = U256Factory.create();
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
`;
}
