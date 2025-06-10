// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class Token {
  static balances: Mapping<Address, U256>;
  static allowance: Mapping2<Address, Address, U256>;

  static setBalance(user: Address, amount: U256): void {
    Token.balances.set(user, amount);
  }

  @View
  static getBalance(user: Address): U256 {
    return Token.balances.get(user);
  }

  static approve(owner: Address, spender: Address, amt: U256): void {
    Token.allowance.set(owner, spender, amt);
  }

  @View
  static allowanceOf(owner: Address, spender: Address): U256 {
    return Token.allowance.get(owner, spender);
  }
}
