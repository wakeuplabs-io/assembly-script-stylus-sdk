# ERC20 Token

A complete example of an ERC20 implementation using the AssemblyScript Stylus SDK.

> **Complete Contract**: You can view the full ERC20 contract implementation [**here**](https://github.com/wakeuplabs-io/assembly-script-stylus-sdk/blob/main/packages/as-stylus/__tests__/contracts/erc20-full/contract.ts).

## Contract Structure

### Events

Events record token activity for external indexing:

```typescript
const Transfer = EventFactory.create<[Address, Address, U256]>({
  indexed: [true, true, false],
});

const Approval = EventFactory.create<[Address, Address, U256]>({
  indexed: [true, true, false],
});
```

### Storage State

State variables that persist on the blockchain:

```typescript
@Contract
export class ERC20Full {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  totalSupplyValue: U256;
  nameValue: Str;
  symbolValue: Str;
```

### Constructor

Initializes the token with name and symbol:

```typescript
  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    this.nameValue = nameStr;
    this.symbolValue = symbolStr;
    this.totalSupplyValue = U256Factory.fromString("0");
  }
```

### View Functions

Read-only methods for querying information:

```typescript
  @View
  name(): Str {
    return this.nameValue;
  }

  @View
  symbol(): Str {
    return this.symbolValue;
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
```

### Transfer Function

Transfers tokens between accounts:

```typescript
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
```

### Approval System

Allows third parties to spend tokens on your behalf:

```typescript
  @External
  approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    allowances.set(owner, spender, amount);
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
    return true;
  }
```

### Mint & Burn

Functions to mint and burn tokens:

```typescript
  @External
  mint(to: Address, amount: U256): void {
    this.totalSupplyValue = this.totalSupplyValue.add(amount);
    const toAmount = this.balances.get(to);
    this.balances.set(to, toAmount.add(amount));

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
```
