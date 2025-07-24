export function getCounterTemplate(): string {
  return `
// @ts-nocheck

@Contract
export class Counter {
  static counter: U256;

  constructor() {
    counter = U256Factory.create();
  }

  @External
  static increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    counter = counter.add(delta);
  }

  @External
  static decrement(): void {
    const delta: U256 = U256Factory.fromString("1");
    counter = counter.sub(delta);
  }

  @View
  static get(): U256 {
    return counter.toString();
  }
}
`;
}
