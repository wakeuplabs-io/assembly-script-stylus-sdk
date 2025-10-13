# @View

The `@View` decorator marks a method as read-only, meaning it cannot modify the contract's state. View methods are gas-free when called statically and are used to query contract data.

## Syntax

```typescript
@View
methodName(param1: Type1, param2: Type2): ReturnType {
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
import { Contract, U256, Address, View } from "@wakeuplabs/as-stylus";

@Contract
export class SimpleStorage {
  value: U256;
  owner: Address;

  @View
  getValue(): U256 {
    return this.value;
  }

  @View
  getOwner(): Address {
    return this.owner;
  }

  @View
  isOwner(address: Address): boolean {
    return this.owner.equals(address);
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
import { Contract, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

@Contract
export class ViewExample {
  counter: U256;

  @View
  getCounter(): U256 {
    return this.counter; // ✅ Reading is allowed
  }

  @View
  invalidMethod(): U256 {
    counter = U256Factory.fromString("10"); // ❌ Writing not allowed
    SomeEvent.emit(); // ❌ Events not allowed
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
import { Contract, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

@Contract
export class Calculator {
  baseValue: U256;

  @View
  calculate(multiplier: U256): U256 {
    // ✅ All of these are allowed in view methods
    const base = this.baseValue; // Read storage
    const result = base.mul(multiplier); // Calculations
    const timestamp = block.timestamp(); // Access blockchain data

    return result.add(bonus);
  }

  @View
  getBonus(): U256 {
    return U256Factory.fromString("100");
  }
}
```

## Advanced Usage

### With Parameters

```typescript
import { Contract, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

@Contract
export class Calculator {
  data: U256;

  @View
  calculate(input: U256): U256 {
    const two = U256Factory.fromString("2");
    return input.add(two);
  }

  @View
  compare(a: U256, b: U256): boolean {
    return a.greaterThan(b);
  }

  @View
  getCurrentData(): U256 {
    return this.data;
  }
}
```

### Step-by-Step Operations

```typescript
import { Contract, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

@Contract
export class Calculator {
  counter: U256;

  constructor() {
    this.counter = U256Factory.fromString("10");
  }

  @View
  getCounter(): U256 {
    return this.counter;
  }

  @View
  addNumbers(a: U256, b: U256): U256 {
    const result: U256 = a.add(b);
    return result;
  }

  @View
  calculateSum(limit: U256): U256 {
    let total = U256Factory.create(); // 0
    const one = U256Factory.fromString("1");

    for (let i = U256Factory.fromString("1"); i.lessThanOrEqual(limit); i = i.add(one)) {
      total = total.add(i);
    }

    return total;
  }

  @View
  multiplyBySteps(base: U256, multiplier: U256): U256 {
    let result = U256Factory.create();
    const one = U256Factory.fromString("1");

    for (let count = U256Factory.create(); count.lessThan(multiplier); count = count.add(one)) {
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
  "inputs": [{ "name": "account", "type": "address" }],
  "outputs": [{ "name": "", "type": "uint256" }],
  "stateMutability": "view"
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation />
