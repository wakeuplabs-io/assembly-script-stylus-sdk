/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  value: U256;
}

@Contract
export class ERC20 {
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  static totalSupply: U256;

  constructor(initialSupply: U256) {
    totalSupply = initialSupply;
    balances.set(msg.sender, initialSupply);
  }

  @View
  static getTotalSupply(): U256 {
    return totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return balances.get(account);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return allowances.get(owner, spender);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return false;
    }

    balances.set(sender, senderBal.sub(amount));

    const recvBal = balances.get(to);
    balances.set(to, recvBal.add(amount));

    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }

    const fromBal = balances.get(from);
    if (fromBal < amount) {
      return false;
    }

    balances.set(from, fromBal.sub(amount));
    const toBal = balances.get(to);
    balances.set(to, toBal.add(amount));

    allowances.set(from, spender, allowed.sub(amount));

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, allowed.sub(amount));
    return true;
  }
}
