import { Contract, View, U256, U256Factory } from "as-stylus";

import { ERC20 } from "./erc20.ts";

@Contract
export class MyToken extends ERC20 {
  constructor(initialSupply: U256) {
    super(initialSupply);
  }

  @View
  decimals(): U256 {
    return U256Factory.fromString("8");
  }
}
