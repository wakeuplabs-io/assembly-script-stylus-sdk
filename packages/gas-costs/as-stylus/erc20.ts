import {
  Address,
  Contract,
  Mapping,
  MappingNested,
  Str,
  U256,
  View,
  External,
  msg,
  AddressFactory,
  U256Factory,
  StrFactory,
  EventFactory,
  ErrorFactory,
} from "@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[from: Address, to: Address, amount: U256]>({
  indexed: [true, true, false],
});

const Approval = EventFactory.create<[owner: Address, spender: Address, amount: U256]>({
  indexed: [true, true, false],
});

const ERC20InvalidApprover = ErrorFactory.create<[approver: Address]>();

const ERC20InvalidSpender = ErrorFactory.create<[spender: Address]>();

const ERC20InsufficientBalance =
  ErrorFactory.create<[sender: Address, balance: U256, needed: U256]>();

const ERC20InsufficientAllowance =
  ErrorFactory.create<[spender: Address, allowance: U256, needed: U256]>();

@Contract
export class ERC20Full {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  totalSupplyValue: U256;
  nameValue: Str;
  symbolValue: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    this.nameValue = nameStr;
    this.symbolValue = symbolStr;
    this.totalSupplyValue = U256Factory.fromString("0");
  }

  @View
  @External
  name(): Str {
    return this.nameValue;
  }

  @View
  @External
  symbol(): Str {
    return this.symbolValue;
  }

  @View
  @External
  decimals(): U256 {
    return U256Factory.fromString("18");
  }

  @View
  @External
  totalSupply(): U256 {
    return this.totalSupplyValue;
  }

  @View
  @External
  balanceOf(account: Address): U256 {
    return this.balances.get(account);
  }

  @View
  @External
  allowance(owner: Address, spender: Address): U256 {
    return this.allowances.get(owner, spender);
  }

  @External
  transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = this.balances.get(sender);
    if (senderBal < amount) {
      ERC20InsufficientBalance.revert(sender, senderBal, amount);
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
    if (spender.isZero()) {
      ERC20InvalidSpender.revert(spender);
    }
    this.allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = this.allowances.get(from, spender);
    if (allowed < amount) {
      ERC20InsufficientAllowance.revert(spender, allowed, amount);
      return false;
    }

    const fromBal = this.balances.get(from);
    if (fromBal < amount) {
      return false;
    }
    const newAllowed = allowed.sub(amount);
    this.balances.set(from, fromBal.sub(amount));
    const toBal = this.balances.get(to);
    this.balances.set(to, toBal.add(amount));

    this.allowances.set(from, spender, newAllowed);

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, newAllowed);
    return true;
  }

  @External
  mint(to: Address, amount: U256): void {
    this.totalSupplyValue = this.totalSupplyValue.add(amount);
    const toAmount = this.balances.get(to);
    const newAmount = toAmount.add(amount);
    this.balances.set(to, newAmount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = this.balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    this.balances.set(sender, senderBal.sub(amount));
    this.totalSupplyValue = this.totalSupplyValue.sub(amount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
}
