import { Contract, External, Internal, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class Parent {
  sum: U256;

  constructor(init: U256) {
    this.sum = init;
  }

  @External
  setValue(a: U256, b: U256): void {
    this.sum = a.add(b);
  }

  @External
  overrideMethod(): U256 {
    return U256Factory.fromString("50");
  }

  @Internal
  getSumByParams(a: U256, b: U256): U256 {
    return a.add(b);
  }
}
