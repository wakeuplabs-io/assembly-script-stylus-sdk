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
export class ERC20Full {
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static allowances: Mapping2<Address, Address, U256> = new Mapping2<Address, Address, U256>();
  static totalSupply: U256;
  static name: Str;
  static symbol: Str;

  constructor(name: string, symbol: string) {
    const nameStr = StrFactory.fromString(name);
    const symbolStr = StrFactory.fromString(symbol);
    ERC20Full.name = nameStr;
    ERC20Full.symbol = symbolStr;
  }

  @View
  static name(): string {
    return ERC20Full.name;
  }

  @View
  static symbol(): string {
    return ERC20Full.symbol;
  }

  @View
  static decimals(): U256 {
    return U256Factory.fromString("18");
  }

  @View
  static totalSupply(): U256 {
    return ERC20Full.totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return ERC20Full.balances.get(account);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return ERC20Full.allowances.get(owner, spender);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = ERC20Full.balances.get(sender);
    if (senderBal < amount) {
      return false;
    }

    ERC20Full.balances.set(sender, senderBal.sub(amount));

    const recvBal = ERC20Full.balances.get(to);
    ERC20Full.balances.set(to, recvBal.add(amount));

    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    ERC20Full.allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = ERC20Full.allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }

    const fromBal = ERC20Full.balances.get(from);
    if (fromBal < amount) {
      return false;
    }

    ERC20Full.balances.set(from, fromBal.sub(amount));
    const toBal = ERC20Full.balances.get(to);
    ERC20Full.balances.set(to, toBal.add(amount));

    ERC20Full.allowances.set(from, spender, allowed.sub(amount));

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, allowed.sub(amount));
    return true;
  }

  @External
  static mint(to: Address, amount: U256): void {
    ERC20Full.totalSupply = ERC20Full.totalSupply.add(amount);
    const toAmount = ERC20Full.balances.get(to);
    const newAmount = toAmount.add(amount);
    ERC20Full.balances.set(to, newAmount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  static burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = ERC20Full.balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    ERC20Full.balances.set(sender, senderBal.sub(amount));
    ERC20Full.totalSupply = ERC20Full.totalSupply.sub(amount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
}
