# Events

Events provide a way to log important contract activities to the blockchain. They enable external applications to listen for specific contract actions and create an audit trail of what happens in your smart contract.

## Overview

Events in the AssemblyScript Stylus SDK use the `EventFactory` to define structured event types that can be emitted during contract execution. Events are stored in transaction logs and can be indexed for efficient querying.

## Creating Events

Use `EventFactory.create()` to define event structures:

```typescript
import { EventFactory, Address, U256 } from "@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[from: Address, to: Address, amount: U256]>({
  indexed: [true, true, false],
});
```

### Syntax

```typescript
const EventName = EventFactory.create<[Type1, Type2, Type3]>({
  indexed: [boolean, boolean, boolean],
});
```

- **Types**: Define the event parameter types in order
- **indexed**: Array of booleans indicating which parameters should be indexed for efficient filtering

## Why Use Events?

Events provide several benefits:

1. **Off-chain Communication**: External applications can listen for events to react to contract changes
2. **Gas Efficiency**: Events are cheaper than storing data in contract state
3. **Audit Trail**: Create a permanent log of contract activities
4. **Indexed Search**: Indexed parameters enable efficient filtering of historical events

## Basic Example

```typescript
import {
  Contract,
  EventFactory,
  External,
  Address,
  U256,
  U256Factory,
} from "@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[from: Address, to: Address, amount: U256]>({
  indexed: [true, true, false],
});

@Contract
export class Token {
  balances: Mapping<Address, U256>;

  @External
  transfer(to: Address, amount: U256): void {
    const from = msg.sender;

    // Update balances
    const fromBalance = this.balances.get(from);
    const toBalance = this.balances.get(to);

    this.balances.set(from, fromBalance.sub(amount));
    this.balances.set(to, toBalance.add(amount));

    // Emit transfer event
    Transfer.emit(from, to, amount);
  }
}
```

## Emitting Events

Call the `.emit()` method on your event with the appropriate parameters:

```typescript
// Simple emission
Transfer.emit(fromAddress, toAddress, amount);

// With constructed values
const message = StrFactory.fromString("Operation completed");
StatusUpdate.emit(user, U256Factory.fromString("100"), message, true);
```
