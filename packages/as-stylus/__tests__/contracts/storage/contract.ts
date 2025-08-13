import { Contract, External, U256, View } from "as-stylus";

@Contract
export class Storage {
  value: U256;

  constructor(initialValue: U256) {
    this.value = initialValue;
  }

  @External
  add(delta: U256): void {
    this.value = this.value.add(delta);
  }

  @External
  sub(delta: U256): void {
    this.value = this.value.sub(delta);
  }

  @View
  get(): U256 {
    return this.value;
  }
}
