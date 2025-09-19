import {
  Contract,
  External,
  View,
  U256,
  Address,
  Mapping,
  MappingNested,
  msg,
  EventFactory,
} from "@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[from: Address, to: Address, amount: U256]>({
  indexed: [true, true, false],
});

const Approval = EventFactory.create<[owner: Address, spender: Address, amount: U256]>({
  indexed: [true, true, false],
});

@Contract
export class ERC20 {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  totalSupply: U256;

  constructor(initialSupply: U256) {
    this.totalSupply = initialSupply;
    this.balances.set(msg.sender, initialSupply);
  }

  @View
  getTotalSupply(): U256 {
    return this.totalSupply;
  }

  @View
  balanceOf(account: Address): U256 {
    return this.balances.get(account);
  }

  @View
  allowance(owner: Address, spender: Address): U256 {
    return this.allowances.get(owner, spender);
  }

  @External
  transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = this.balances.get(sender);
    if (senderBal < amount) {
      return false;
    }

    this.balances.set(sender, senderBal.sub(amount));

    const recvBal = this.balances.get(to);
    this.balances.set(to, recvBal.add(amount));

    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    this.allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = this.allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }

    const fromBal = this.balances.get(from);
    if (fromBal < amount) {
      return false;
    }

    this.balances.set(from, fromBal.sub(amount));
    const toBal = this.balances.get(to);
    this.balances.set(to, toBal.add(amount));

    this.allowances.set(from, spender, allowed.sub(amount));

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, allowed.sub(amount));
    return true;
  }
}
