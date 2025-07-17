# @Event Decorator

The `@Event` decorator defines event structures for logging blockchain events. Events provide a way to communicate with external applications and create an audit trail of contract activity.

## Syntax

```typescript
@Event
class EventName {
  field1: Type1;
  field2: Type2;
  field3: Type3;
}
```

## Purpose

Events provide:
- Structured blockchain logging
- Contract activity tracking
- Off-chain application communication

## Basic Example

```typescript
@Event
class Transfer {
  from: Address;
  to: Address;
  amount: U256;
}

@Contract
export class SimpleContract {
  @External
  static performTransfer(from: Address, to: Address, amount: U256): void {
    // Emit event
    Transfer.emit(from, to, amount);
  }
}
```

## Event Types

```typescript
@Event
class SimpleEvent {
  user: Address;
  amount: U256;
  message: String;
  active: Boolean;
}

@Contract
export class EventContract {
  @External
  static doSomething(user: Address, amount: U256): void {
    const message = StrFactory.fromString("Action completed");
    SimpleEvent.emit(user, amount, message, true);
  }
}
```

## Multiple Events

```typescript
@Event
class UserJoined {
  user: Address;
  timestamp: U256;
}

@Event
class ValueUpdated {
  oldValue: U256;
  newValue: U256;
}

@Contract
export class MultiEventContract {
  static currentValue: U256;

  @External
  static join(user: Address, timestamp: U256): void {
    UserJoined.emit(user, timestamp);
  }

  @External
  static updateValue(newValue: U256): void {
    const oldValue = MultiEventContract.currentValue;
    MultiEventContract.currentValue = newValue;
    ValueUpdated.emit(oldValue, newValue);
  }
}

  @External
  static approve(spender: Address, amount: U256): void {
    
    ERC20Token.allowances.get(owner).set(spender, amount);
    Approval.emit(owner, spender, amount);
  }

  @External
  static mint(to: Address, amount: U256): void {
    ERC20Token.balances.set(to, ERC20Token.balances.get(to).add(amount));
    ERC20Token.totalSupply = ERC20Token.totalSupply.add(amount);
    
    Mint.emit(to, amount, ERC20Token.totalSupply);
    Transfer.emit(Address.zero(), to, amount); // Mint as transfer from zero
  }
}
```

### Complex Event Data

```typescript
@Event
class OrderCreated {
  @Indexed orderId: U256;
  @Indexed creator: Address;
  price: U256;
  quantity: U256;
  orderType: U256;      // 0 = buy, 1 = sell
  timestamp: U256;
  metadata: String;
}

@Event
class OrderMatched {
  @Indexed orderId1: U256;
  @Indexed orderId2: U256;
  matchedQuantity: U256;
  matchedPrice: U256;
  buyer: Address;
  seller: Address;
  timestamp: U256;
}

@Contract
export class DecentralizedExchange {
  @External
  static createOrder(price: U256, quantity: U256, orderType: U256): void {
    const orderId = DEX.generateOrderId();
    
    
    // Store order logic...
    
    OrderCreated.emit(
      orderId,
      creator,
      price,
      quantity,
      orderType,
      block.timestamp(),
      String.from("Order created successfully")
    );
  }

  @External
  static matchOrders(orderId1: U256, orderId2: U256): void {
    // Matching logic...
    
    OrderMatched.emit(
      orderId1,
      orderId2,
      matchedQuantity,
      matchedPrice,
      buyer,
      seller,
      block.timestamp()
    );
  }
}
```

### State Change Events

```typescript
@Event
class StateChanged {
  @Indexed previousState: U256;
  @Indexed newState: U256;
  @Indexed changedBy: Address;
  reason: String;
  timestamp: U256;
}

@Event
class ConfigUpdated {
  @Indexed parameter: String;
  previousValue: U256;
  newValue: U256;
  updatedBy: Address;
}

@Contract
export class StateMachine {
  static currentState: U256;
  static config: Mapping<String, U256>;

  @External
  static changeState(newState: U256, reason: String): void {
    const previousState = StateMachine.currentState;
    
    
    StateMachine.currentState = newState;
    
    StateChanged.emit(
      previousState,
      newState,
      changer,
      reason,
      block.timestamp()
    );
  }

  @External
  static updateConfig(parameter: String, newValue: U256): void {
    const previousValue = StateMachine.config.get(parameter);
    
    
    StateMachine.config.set(parameter, newValue);
    
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
  Boolean.create(true)
);
```

### Conditional Emission

```typescript
@Contract
export class ConditionalEvents {
  @External
  static processTransaction(amount: U256): void {
    
    
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

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 