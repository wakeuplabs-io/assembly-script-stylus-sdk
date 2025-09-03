import { Address, U256 } from "@wakeuplabs/as-stylus";

interface IERC20 {
  balanceOf(account: Address): U256;
}

@contract
export default class SimpleInterfaceTest {
  static tokenAddress: Address;

  @external
  static getBalance(account: Address): U256 {
    // Simple interface cast and call
    const token = (SimpleInterfaceTest.tokenAddress as IERC20);
    return token.balanceOf(account);
  }
}