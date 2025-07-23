// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

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
