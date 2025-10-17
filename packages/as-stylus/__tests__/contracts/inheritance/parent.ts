import { Contract, External, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class Parent {
  value: U256;

  constructor(initialValue: U256) {
    this.value = initialValue;
  }

  @External
  getValue(): U256 {
    return this.value;
  }

  @External
  setValue(newValue: U256): void {
    this.value = newValue;
  }

  @External
  addToValue(amount: U256): void {
    this.value = this.value.add(amount);
  }

  @External
  getParentMessage(): U256 {
    return U256Factory.fromString("10"); // Parent returns 10
  }
}
