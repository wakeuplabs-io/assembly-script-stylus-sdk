import { Contract, External, U256, U256Factory } from "@wakeuplabs/as-stylus";

import { Parent } from "./parent.js";

@Contract
export class Child extends Parent {
  constructor(init: U256) {
    super(init);
  }

  @External
  getSum(): U256 {
    return this.sum;
  }

  @External
  overrideMethod(): U256 {
    return U256Factory.fromString("5");
  }

  @External
  getSumInMemory(a: U256, b: U256): U256 {
    return this.getSumByParams(a, b);
  }
}
