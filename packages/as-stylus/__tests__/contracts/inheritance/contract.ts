// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Parent } from "./parent.js";

@Contract
export class Child extends Parent {
  constructor(init: U256) {
    super(init);
  }

  @External
  static getSum(): U256 {
    return sum;
  }

  @External
  static overrideMethod(): U256 {
    return U256Factory.fromString("5");
  }

  @External
  static getSumInMemory(a: U256, b: U256): U256 {
    return getSumByParams(a, b);
  }
}
