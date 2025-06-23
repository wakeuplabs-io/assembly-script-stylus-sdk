// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class IfHappyPath {
  @View
  static getLowerWithFlag(): U256 {
    const flag = true;
    if (flag) {
      return U256Factory.fromString("5");
    } else {
      return U256Factory.fromString("10");
    }
  }

  @View
  static getLowerWithComparison(): U256 {
    const delta = U256Factory.fromString("1");
    const alpha = U256Factory.fromString("2");
    if (delta.lessThan(alpha)) {
      return delta;
    } else {
      return alpha;
    }
  }

  @View
  static getLowerWithComparisonFunction(): U256 {
    if (getFalseFlag()) {
      return U256Factory.fromString("5");
    } else {
      return U256Factory.fromString("10");
    }
  }

  @View
  static getLowerWithNestedIf(): U256 {
    const nestedFlag = false;
    if (getTrueFlag())
      if (getFalseFlag()) {
        // TODO: missing boolean operators
        // if (!getFlag()) {
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
  static getTrueFlag(): boolean {
    return true;
  }

  static getFalseFlag(): boolean {
    return false;
  }
}
