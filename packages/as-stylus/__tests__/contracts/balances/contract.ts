import { Address, Contract, Mapping, MappingNested, U256, View } from "as-stylus";

@Contract
export class Token {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowance: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();

  setBalance(user: Address, amount: U256): void {
    this.balances.set(user, amount);
  }

  @View
  getBalance(user: Address): U256 {
    return this.balances.get(user);
  }

  approve(owner: Address, spender: Address, amt: U256): void {
    this.allowance.set(owner, spender, amt);
  }

  @View
  allowanceOf(owner: Address, spender: Address): U256 {
    return this.allowance.get(owner, spender);
  }
}
