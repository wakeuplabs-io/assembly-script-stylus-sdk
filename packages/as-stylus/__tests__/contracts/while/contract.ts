import {
  Contract,
  External,
  View,
  U256,
  Str,
  I256,
  U256Factory,
  I256Factory,
  StrFactory,
} from "as-stylus";

@Contract
export class WhileTest {
  u256Counter: U256;
  i256Counter: I256;
  booleanFlag: boolean;
  loopIterations: U256;
  maxIterations: U256;
  stringCounter: U256;
  currentString: Str;

  constructor() {
    this.u256Counter = U256Factory.create();
    this.i256Counter = I256Factory.create();
    this.booleanFlag = false;
    this.loopIterations = U256Factory.create();
    this.maxIterations = U256Factory.fromString("10");
    this.stringCounter = U256Factory.create();
    this.currentString = StrFactory.fromString("");
  }

  @External
  testWhileWithU256(): void {
    let iterator = U256Factory.create();
    const limit = U256Factory.fromString("5");
    const one = U256Factory.fromString("1");

    while (iterator.lessThan(limit)) {
      this.u256Counter = this.u256Counter.add(one);
      iterator = iterator.add(one);
    }
  }

  @External
  testWhileWithI256(): void {
    let iterator = I256Factory.create();
    const limit = I256Factory.fromString("3");
    const one = I256Factory.fromString("1");

    while (iterator.lessThan(limit)) {
      this.i256Counter = this.i256Counter.add(one);
      iterator = iterator.add(one);
    }
  }

  @External
  testWhileWithBoolean(): void {
    let count = U256Factory.create();
    const maxCount = U256Factory.fromString("4");

    while (count < maxCount) {
      const one = U256Factory.fromString("1");
      this.u256Counter = this.u256Counter.add(one);
      count = count.add(one);
    }
  }

  @View
  getU256Counter(): U256 {
    return this.u256Counter;
  }

  @View
  getI256Counter(): I256 {
    return this.i256Counter;
  }

  @View
  getBooleanFlag(): boolean {
    return this.booleanFlag;
  }

  @View
  getLoopIterations(): U256 {
    return this.loopIterations;
  }

  @View
  getMaxIterations(): U256 {
    return this.maxIterations;
  }

  @View
  getStringCounter(): U256 {
    return this.stringCounter;
  }

  @View
  getCurrentString(): Str {
    return this.currentString;
  }
}
