import {
  Address,
  Contract,
  ErrorFactory,
  EventFactory,
  External,
  msg,
  U256,
  U256Factory,
  View,
} from "@wakeuplabs/as-stylus";

@Contract
export class Counter {
  x: U256;

  @External
  inc(): void {
    const one = U256Factory.fromString("1");
    this.x = this.x.add(one);
  }

  @External
  incBy(by: U256): void {
    this.x = this.x.add(by);
  }

  @View
  getX(): U256 {
    return this.x;
  }
}
