// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class Storage {
  static value: U256;

  constructor(initialValue: U256) {
    value = initialValue;
  }

  @External
  static add(delta: U256): void {
    value = value.add(delta);
  }

  @External
  static sub(delta: U256): void {
    value = value.sub(delta);
  }

  @View
  static get(): U256 {
    return value;
  }
}
