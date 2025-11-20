import { Contract, External, U256, U256Factory } from "@wakeuplabs/as-stylus";

import { Parent } from "./parent.js";

@Contract
export class Child extends Parent {
  multiplier: U256;

  constructor(initialValue: U256, _multiplier: U256) {
    super(initialValue);
    this.multiplier = _multiplier;
  }

  @External
  getMultiplier(): U256 {
    return this.multiplier;
  }

  @External
  multiplyValue(): U256 {
    return this.value.mul(this.multiplier);
  }

  @External
  getParentMessage(): U256 {
    return U256Factory.fromString("20"); // Child returns 20 instead of 10
  }

  @External
  getChildMessage(): U256 {
    return U256Factory.fromString("30"); // Child-specific method
  }
}
