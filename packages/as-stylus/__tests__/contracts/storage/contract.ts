// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class Storage {
  static value: U256;

  constructor(initialValue: U256) {
    Storage.value = initialValue;
  }

  @External
  static add(delta: U256): void {
    Storage.value = Storage.value.add(delta);
  }

  @External
  static sub(delta: U256): void {
    Storage.value = Storage.value.sub(delta);
  }

  @View
  static get(): U256 {
    return Storage.value;
  }
}
