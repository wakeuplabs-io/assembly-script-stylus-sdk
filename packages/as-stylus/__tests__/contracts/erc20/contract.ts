import {
  Address,
  Contract,
  Event,
  External,
  Indexed,
  Mapping,
  MappingNested,
  View,
  U256,
  msg,
} from "as-stylus";

@Event
export class Transfer {
  @Indexed from!: Address;
  @Indexed to!: Address;
  value!: U256;
}

@Event
export class Approval {
  @Indexed owner!: Address;
  @Indexed spender!: Address;
  value!: U256;
}

@Contract
export class ERC20 {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  totalSupplyValue: U256;

  constructor(initialSupply: U256) {
    this.totalSupplyValue = initialSupply;
    this.balances.set(msg.sender, initialSupply);
  }

  @View
  totalSupply(): U256 {
    return this.totalSupplyValue;
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
