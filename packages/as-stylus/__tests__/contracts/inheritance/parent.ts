// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class Parent {
  static sum: U256;

  constructor(init: U256) {
    sum = init;
  }

  @External
  static setValue(a: U256, b: U256): void {
    sum = a.add(b);
  }

  @External
  static overrideMethod(): U256 {
    return U256Factory.fromString("50");
  }

  @Internal
  static getSumByParams(a: U256, b: U256): U256 {
    return a.add(b);
  }
}
