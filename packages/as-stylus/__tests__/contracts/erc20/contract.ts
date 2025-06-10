// eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
  static allowances: Mapping2<Address, Address, U256> = new Mapping2<Address, Address, U256>();
  static totalSupply: U256;

  constructor(initialSupply: U256) {
    ERC20.totalSupply = initialSupply;
    ERC20.balances.set(msg.sender, initialSupply);
  }

  @View
  static totalSupply(): U256 {
    return ERC20.totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return ERC20.balances.get(account);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return ERC20.allowances.get(owner, spender);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = ERC20.balances.get(sender);
    if (senderBal < amount) {
      return false;
    }

    ERC20.balances.set(sender, senderBal.sub(amount));

    const recvBal = ERC20.balances.get(to);
    ERC20.balances.set(to, recvBal.add(amount));

    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    ERC20.allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = ERC20.allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }

    const fromBal = ERC20.balances.get(from);
    if (fromBal < amount) {
      return false;
    }

    ERC20.balances.set(from, fromBal.sub(amount));
    const toBal = ERC20.balances.get(to);
    ERC20.balances.set(to, toBal.add(amount));

    ERC20.allowances.set(from, spender, allowed.sub(amount));

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, allowed.sub(amount));
    return true;
  }
}
