# ERC20 Token

A complete example of an ERC20 implementation using the AssemblyScript Stylus SDK.

## Contract Structure

### Events
Events record token activity for external indexing:

```typescript
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
```

### Storage State
State variables that persist on the blockchain:

```typescript
@Contract
export class ERC20Full {
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static allowances: Mapping2<Address, Address, U256> = new Mapping2<Address, Address, U256>();
  static totalSupply: U256;
  static name: Str;
  static symbol: Str;
```

### Constructor
Initializes the token with name and symbol:

```typescript
  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }
```

### View Functions
Read-only methods for querying information:

```typescript
  @View
  static name(): string {
    return name;
  }

  @View
  static symbol(): string {
    return symbol;
  }

  @View
  static totalSupply(): U256 {
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
```

### Transfer Function
Transfers tokens between accounts:

```typescript
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
```

### Approval System
Allows third parties to spend tokens on your behalf:

```typescript
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
    return true;
  }
```

### Mint & Burn
Functions to mint and burn tokens:

```typescript
  @External
  static mint(to: Address, amount: U256): void {
    totalSupply = totalSupply.add(amount);
    const toAmount = balances.get(to);
    balances.set(to, toAmount.add(amount));
    
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  static burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    
    balances.set(sender, senderBal.sub(amount));
    totalSupply = totalSupply.sub(amount);
    
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
} 