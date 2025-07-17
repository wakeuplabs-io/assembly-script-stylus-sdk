# @Event Decorator

The `@Event` decorator defines event structures for logging blockchain events. Events provide a way to communicate with external applications and create an audit trail of contract activity.

## Syntax

```typescript
@Event
class EventName {
  field1: Type1;
  field2: Type2;
  @Indexed field3: Type3;  // Optional: indexed for filtering
}
```

## Purpose

The `@Event` decorator:

- **Logging Mechanism**: Creates structured logs on the blockchain
- **External Communication**: Allows off-chain applications to monitor contract activity
- **Gas Efficient**: More efficient than storage for temporary data
- **Filtering Support**: Indexed fields enable efficient event filtering
- **ABI Generation**: Automatically generates event ABI entries

## Basic Example

```typescript
@Event
class Transfer {
  from: Address;
  to: Address;
  amount: U256;
}

@Contract
export class Token {
  static balances: Mapping<Address, U256>;

  @External
  static transfer(to: Address, amount: U256): void {
    const sender = msg.sender();
    
    // Perform transfer logic
    Token.balances.set(sender, Token.balances.get(sender).sub(amount));
    Token.balances.set(to, Token.balances.get(to).add(amount));
    
    // Emit event
    Transfer.emit(sender, to, amount);
  }
}
```

## Event Fields and Types

### Supported Field Types

```typescript
@Event
class CompleteExample {
  uintValue: U256;      // ✅ 256-bit unsigned integer
  intValue: I256;       // ✅ 256-bit signed integer
  addressValue: Address; // ✅ Ethereum address
  stringValue: String;   // ✅ Dynamic string
  boolValue: Boolean;    // ✅ Boolean value
}

// ❌ Unsupported types
@Event
class InvalidEvent {
  complexObject: CustomClass;  // Error: Unsupported type
  mapping: Mapping<Address, U256>; // Error: Mappings not allowed
}
```

### Indexed Fields

Use `@Indexed` to make fields searchable:

```typescript
@Event
class UserAction {
  @Indexed user: Address;        // Filterable by user
  @Indexed actionType: U256;     // Filterable by action type
  timestamp: U256;               // Not indexed
  data: String;                  // Not indexed
}

// Usage: Filter events by specific user
// contract.on(UserAction, { user: "0x123..." }, callback);
```

## Advanced Usage

### Multiple Events in Contract

```typescript
@Event
class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  amount: U256;
}

@Event
class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  amount: U256;
}

@Event
class Mint {
  @Indexed to: Address;
  amount: U256;
  totalSupply: U256;
}

@Contract
export class ERC20Token {
  static balances: Mapping<Address, U256>;
  static allowances: Mapping<Address, Mapping<Address, U256>>;
  static totalSupply: U256;

  @External
  static transfer(to: Address, amount: U256): void {
    const sender = msg.sender();
    // Transfer logic...
    Transfer.emit(sender, to, amount);
  }

  @External
  static approve(spender: Address, amount: U256): void {
    const owner = msg.sender();
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
    const creator = msg.sender();
    
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
    const changer = msg.sender();
    
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
    const updater = msg.sender();
    
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
    const sender = msg.sender();
    
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

## Gas Considerations

Events are gas-efficient but costs vary:

```typescript
@Event
class LowCostEvent {
  value: U256;                    // ~375 gas
}

@Event  
class MediumCostEvent {
  @Indexed value: U256;           // ~750 gas (indexed)
  data: String;                   // Variable cost
}

@Event
class HighCostEvent {
  @Indexed field1: Address;       // ~375 gas each indexed field
  @Indexed field2: U256;
  @Indexed field3: String;
  largeData: String;              // Cost depends on string length
}
```

## Error Messages

Common compilation errors:

```typescript
// Error: "Event must be a class"
@Event
const InvalidEvent = { };  // Not a class

// Error: "Unsupported event field type"
@Event
class BadEvent {
  invalidField: ComplexObject;  // Unsupported type
}

// Error: "Too many indexed fields"
@Event
class TooManyIndexed {
  @Indexed field1: Address;  // Maximum 3 indexed fields
  @Indexed field2: Address;
  @Indexed field3: Address;
  @Indexed field4: Address;  // Error: Too many
}
```

## Best Practices

1. **Meaningful Names**: Use descriptive event names and field names
2. **Index Important Fields**: Index fields that will be filtered
3. **Limit Indexed Fields**: Maximum 3 indexed fields per event
4. **Consistent Structure**: Keep related events structurally similar
5. **Documentation**: Document when and why events are emitted

```typescript
/**
 * Emitted when tokens are transferred between addresses
 * @param from Source address (zero for minting)
 * @param to Destination address (zero for burning)
 * @param amount Number of tokens transferred
 */
@Event
class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  amount: U256;
}

/**
 * Emitted when approval is granted for token spending
 * @param owner Token owner address
 * @param spender Approved spender address
 * @param amount Approved amount
 */
@Event
class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  amount: U256;
}

@Contract
export class WellDocumentedToken {
  @External
  static transfer(to: Address, amount: U256): void {
    // Validation and transfer logic...
    
    // Always emit transfer event for transparency
    Transfer.emit(msg.sender(), to, amount);
  }
}
```

## Event Filtering

External applications can filter events:

```javascript
// JavaScript example - filtering by indexed fields
contract.on(Transfer, { from: userAddress }, (event) => {
  console.log(`User sent ${event.amount} tokens to ${event.to}`);
});

// Filter by multiple indexed fields
contract.on(Approval, { 
  owner: ownerAddress, 
  spender: spenderAddress 
}, (event) => {
  console.log(`Approval amount: ${event.amount}`);
});
```

## Related Decorators

- [`@Indexed`](visibility.md) - For making event fields filterable
- [`@Contract`](contract.md) - Required container
- [`@External`](external.md) - Methods that can emit events
- [`@Error`](error.md) - For error handling

Events are essential for creating transparent and monitorable smart contracts! 