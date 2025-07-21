# @View

The `@View` decorator marks a method as read-only, meaning it cannot modify the contract's state. View methods are gas-free when called statically and are used to query contract data.

## Syntax

```typescript
@View
static methodName(param1: Type1, param2: Type2): ReturnType {
  // Read-only implementation
}
```

## Purpose

The `@View` decorator:

- **Read-Only Access**: Methods can only read state, not modify it
- **Gas-Free Calls**: No gas cost when called as static calls (queries)
- **ABI Generation**: Includes methods in ABI with "view" state mutability
- **Query Interface**: Provides external interface for data access
- **No Transactions**: Can be called without sending a transaction

## Basic Example

```typescript
@Contract
export class SimpleStorage {
  static value: U256;
  static owner: Address;

  @View
  static getValue(): U256 {
    return value;
  }

  @View
  static getOwner(): Address {
    return owner;
  }

  @View
  static isOwner(address: Address): Boolean {
    return owner.equals(address);
  }
}
```

## Rules and Constraints

### Read-Only Restriction
View methods **cannot**:
- Modify storage variables
- Emit events
- Call non-view external functions
- Create or modify contracts

```typescript
@Contract
export class ViewExample {
  static counter: U256;

  @View
  static getCounter(): U256 {
    return counter;  // ✅ Reading is allowed
  }

  @View
  static invalidMethod(): U256 {
    counter = U256Factory.fromString("10");  // ❌ Writing not allowed
    SomeEvent.emit();  // ❌ Events not allowed
    return counter;
  }
}
```

### Supported Operations
View methods **can**:
- Read storage variables
- Perform calculations
- Access blockchain data (block, msg info)

```typescript
@Contract
export class Calculator {
  static baseValue: U256;

  @View
  static calculate(multiplier: U256): U256 {
    // ✅ All of these are allowed in view methods
    const base = baseValue;               // Read storage
    const result = base.mul(multiplier);  // Calculations
    const timestamp = block.timestamp();  // Access blockchain data
    
    return result.add(bonus);
  }

  @View
  static getBonus(): U256 {
    return U256Factory.fromString("100");
  }
}
```

## Advanced Usage

### With Parameters

```typescript
@Contract
export class Calculator {
  static data: U256;

  @View
  static calculate(input: U256): U256 {
    const two = U256Factory.fromString("2");
    return input.add(two);
  }

  @View
  static compare(a: U256, b: U256): Boolean {
    return a.greaterThan(b);
  }

  @View
  static getCurrentData(): U256 {
    return data;
  }
```

### Step-by-Step Operations

```typescript
@Contract
export class Calculator {
  static counter: U256;

  constructor() {
    counter = U256Factory.fromString("10");
  }

  @View
  static getCounter(): U256 {
    return counter;
  }

  @View
  static addNumbers(a: U256, b: U256): U256 {
    const result: U256 = a.add(b);
    return result;
  }

  @View
  static calculateSum(limit: U256): U256 {
    let total = U256Factory.create(); // 0
    const one = U256Factory.fromString("1");
    
    for (
      let i = U256Factory.fromString("1");
      i.lessThanOrEqual(limit);
      i = i.add(one)
    ) {
      total = total.add(i);
    }
    
    return total;
  }

  @View
  static multiplyBySteps(base: U256, multiplier: U256): U256 {
    let result = U256Factory.create();
    const one = U256Factory.fromString("1");
    
    for (
      let count = U256Factory.create();
      count.lessThan(multiplier);
      count = count.add(one)
    ) {
      result = result.add(base);
    }
    
    return result;
  }
}
```


## Gas Efficiency

View methods are gas-free when called as static calls:

```typescript
// Called as static call (no gas)
const balance = await contract.balanceOf.staticCall(userAddress);

// Called in transaction (gas required)
const tx = await contract.someExternalMethod();
```

## ABI Generation

View methods generate ABI entries with "view" state mutability:

```json
{
  "type": "function",
  "name": "balanceOf",
  "inputs": [
    {"name": "account", "type": "address"}
  ],
  "outputs": [
    {"name": "", "type": "uint256"}
  ],
  "stateMutability": "view"
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 