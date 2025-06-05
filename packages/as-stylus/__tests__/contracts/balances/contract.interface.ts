import { Address } from "../../../cli/types/address.inteface.js";
import { U256 } from "../../../cli/types/u256.interface.js";

export interface IERC20 {
  totalSupply(): U256;

  balanceOf(account: Address): U256;

  transfer(to: Address, amount: U256): boolean;

  allowance(owner: Address, spender: Address): U256;

  approve(spender: Address, amount: U256): boolean;

  transferFrom(from: Address, to: Address, amount: U256): boolean;
}
