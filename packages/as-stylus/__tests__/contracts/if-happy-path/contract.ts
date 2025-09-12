import { Contract, External, View, U256, U256Factory } from "as-stylus";

@Contract
export class IfHappyPath {
  flag_storage: boolean;

  constructor() {
    this.flag_storage = false;
  }

  @External
  setFlag(flag: boolean): void {
    this.flag_storage = flag;
  }

  @View
  getFlag(): boolean {
    const flag = this.flag_storage;
    return flag;
  }

  @View
  getLowerWithFlag(): U256 {
    const flag = true;
    if (flag) {
      return U256Factory.fromString("5");
    } else {
      return U256Factory.fromString("10");
    }
  }

  @View
  getLowerWithComparison(): U256 {
    const delta = U256Factory.fromString("1");
    const alpha = U256Factory.fromString("2");
    if (delta.lessThan(alpha)) {
      return delta;
    } else {
      return alpha;
    }
  }

  @View
  getLowerWithComparisonFunction(): U256 {
    if (this.getFalseFlag()) {
      return U256Factory.fromString("5");
    } else {
      return U256Factory.fromString("10");
    }
  }

  @View
  getLowerWithNestedIf(): U256 {
    const nestedFlag = false;
    if (this.getTrueFlag())
      if (this.getFalseFlag()) {
        return U256Factory.fromString("0");
      } else if (nestedFlag) {
        return U256Factory.fromString("2");
      } else {
        return U256Factory.fromString("3");
      }
    else {
      return U256Factory.fromString("4");
    }
  }

  @View
  getValueWithBooleanOperators(): boolean {
    const flag = false;
    if (!flag && !this.getTrueFlag()) return false;
    return true;
  }

  @View
  getTrueFlag(): boolean {
    return true;
  }

  @View
  getFalseFlag(): boolean {
    return false;
  }
}
