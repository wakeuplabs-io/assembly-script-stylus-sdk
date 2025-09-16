# @Event

The `EventFactory` defines event structures for logging blockchain events. Events provide a way to communicate with external applications and create an audit trail of contract activity.

## Syntax

```typescript
const EventName = EventFactory.create<[Type1, Type2, Type3]>({
  indexed: [true, true, false],
});
```

## Purpose

Events provide:

- Structured blockchain logging
- Contract activity tracking
- Off-chain application communication

## Basic Example

```typescript
import { Contract, EventFactory, External, Address, U256 } from "@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[Address, Address, U256]>({
  indexed: [true, true, false],
});

@Contract
export class SimpleContract {
  @External
  performTransfer(from: Address, to: Address, amount: U256): void {
    // Emit event
    Transfer.emit(from, to, amount);
  }
}
```

## Event Types

```typescript
import {
  Contract,
  EventFactory,
  External,
  Address,
  StrFactory,
  String,
  U256,
} from "@wakeuplabs/as-stylus";

const SimpleEvent = EventFactory.create<[Address, U256, String, boolean]>({
  indexed: [true, true, true, true, true],
});

@Contract
export class EventContract {
  @External
  doSomething(user: Address, amount: U256): void {
    const message = StrFactory.fromString("Action completed");
    SimpleEvent.emit(user, amount, message, true);
  }
}
```

## Multiple Events

```typescript
import { Contract, EventFactory, External, Address, U256 } from "@wakeuplabs/as-stylus";

const UserJoined = EventFactory.create<[Address, U256]>({
  indexed: [true, true],
});

const ValueUpdated = EventFactory.create<[U256, U256]>({
  indexed: [true, true],
});

@Contract
export class MultiEventContract {
  currentValue: U256;

  @External
  join(user: Address, timestamp: U256): void {
    UserJoined.emit(user, timestamp);
  }

  @External
  updateValue(newValue: U256): void {
    const oldValue = this.currentValue;
    this.currentValue = newValue;
    ValueUpdated.emit(oldValue, newValue);
  }
}
```

### Complex Event Data

```typescript
import { Contract, EventFactory, External, Address, U256 } from "@wakeuplabs/as-stylus";

const OrderCreated = EventFactory.create<[U256, Address, U256, U256, U256, U256, String]>({
  indexed: [true, true, false, false, false, false, false],
});

const OrderMatched = EventFactory.create<[U256, U256, U256, U256, Address, Address, U256]>({
  indexed: [true, true, false, false, false, false, false],
});

@Contract
export class DecentralizedExchange {
  @External
  createOrder(price: U256, quantity: U256, orderType: U256): void {
    const orderId = DEX.generateOrderId();

    // Store order logic...

    OrderCreated.emit(
      orderId,
      creator,
      price,
      quantity,
      orderType,
      block.timestamp(),
      String.from("Order created successfully"),
    );
  }

  @External
  matchOrders(orderId1: U256, orderId2: U256): void {
    // Matching logic...

    OrderMatched.emit(
      orderId1,
      orderId2,
      matchedQuantity,
      matchedPrice,
      buyer,
      seller,
      block.timestamp(),
    );
  }
}
```

### State Change Events

```typescript
import {
  Contract,
  EventFactory,
  External,
  Mapping,
  String,
  Address,
  U256,
} from "@wakeuplabs/as-stylus";

const StateChanged = EventFactory.create<[U256, U256, Address, String, U256]>({
  indexed: [true, true, true, false, false],
});

const ConfigUpdated = EventFactory.create<[String, U256, U256, Address]>({
  indexed: [true, false, false, false],
});

@Contract
export class StateMachine {
  currentState: U256;
  config: Mapping<String, U256>;

  @External
  changeState(newState: U256, reason: String): void {
    const previousState = this.currentState;

    this.currentState = newState;

    StateChanged.emit(previousState, newState, changer, reason, block.timestamp());
  }

  @External
  updateConfig(parameter: String, newValue: U256): void {
    const previousValue = this.config.get(parameter);

    this.config.set(parameter, newValue);

    ConfigUpdated.emit(parameter, previousValue, newValue, updater);
  }
}
```

## Event Emission

### Basic Emission

```typescript
// Simple event emission
Transfer.emit(from, to, amount);

// With all field types
ComplexEvent.emit(
  U256Factory.fromString("123"),
  I256Factory.fromString("-456"),
  Address.fromString("0x1234..."),
  String.from("Hello World"),
  Boolean.create(true),
);
```

### Conditional Emission

```typescript
@Contract
export class ConditionalEvents {
  @External
  processTransaction(amount: U256): void {
    // Emit different events based on conditions
    if (amount.greaterThan(U256Factory.fromString("1000000"))) {
      LargeTransaction.emit(sender, amount, block.timestamp());
    } else {
      RegularTransaction.emit(sender, amount);
    }

    // Always emit a general event
    TransactionProcessed.emit(sender, amount, true);
  }
}
```

## ABI Generation

Events generate ABI entries:

```json
{
  "type": "event",
  "name": "Transfer",
  "inputs": [
    {
      "name": "from",
      "type": "address",
      "indexed": true
    },
    {
      "name": "to",
      "type": "address",
      "indexed": true
    },
    {
      "name": "amount",
      "type": "uint256",
      "indexed": false
    }
  ],
  "anonymous": false
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation />
