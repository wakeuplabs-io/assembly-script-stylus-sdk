# @View Decorator

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
    return SimpleStorage.value;
  }

  @View
  static getOwner(): Address {
    return SimpleStorage.owner;
  }

  @View
  static isOwner(address: Address): Boolean {
    return SimpleStorage.owner.equals(address);
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
    return ViewExample.counter;  // ✅ Reading is allowed
  }

  @View
  static invalidMethod(): U256 {
    ViewExample.counter = U256Factory.fromString("10");  // ❌ Writing not allowed
    SomeEvent.emit();  // ❌ Events not allowed
    return ViewExample.counter;
  }
}
```

### Supported Operations
View methods **can**:
- Read storage variables
- Perform calculations
- Call other view methods
- Access blockchain data (block, msg info)

```typescript
@Contract
export class Calculator {
  static baseValue: U256;

  @View
  static calculate(multiplier: U256): U256 {
    // ✅ All of these are allowed in view methods
    const base = Calculator.baseValue;           // Read storage
    const result = base.mul(multiplier);         // Calculations
    const bonus = Calculator.getBonus();         // Call other view methods
    const timestamp = block.timestamp();         // Access blockchain data
    
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
    return Calculator.data;
  }
```

### Mathematical Computations

```typescript
@Contract
export class MathLibrary {
  @View
  static add(a: U256, b: U256): U256 {
    return a.add(b);
  }

  @View
  static multiply(a: U256, b: U256): U256 {
    return a.mul(b);
  }

  @View
  static power(base: U256, exponent: U256): U256 {
    let result = U256Factory.fromString("1");
    let exp = exponent;
    let b = base;

    while (exp.greaterThan(U256Factory.create())) {
      if (exp.mod(U256Factory.fromString("2")).equals(U256Factory.fromString("1"))) {
        result = result.mul(b);
      }
      b = b.mul(b);
      exp = exp.div(U256Factory.fromString("2"));
    }

    return result;
  }

  @View
  static sqrt(value: U256): U256 {
    if (value.isZero()) {
      return U256Factory.create();
    }

    let result = value;
    let x = value.div(U256Factory.fromString("2")).add(U256Factory.fromString("1"));

    while (x.lessThan(result)) {
      result = x;
      x = value.div(x).add(x).div(U256Factory.fromString("2"));
    }

    return result;
  }
}
```

### Validation and Checks

```typescript
@Contract
export class ValidationContract {
  static whitelist: Mapping<Address, Boolean>;
  static threshold: U256;

  @View
  static isWhitelisted(address: Address): Boolean {
    return ValidationContract.whitelist.get(address);
  }

  @View
  static meetsThreshold(amount: U256): Boolean {
    return amount.greaterThanOrEqual(ValidationContract.threshold);
  }

  @View
  static validateTransfer(from: Address, to: Address, amount: U256): ValidationResult {
    const result = new ValidationResult();
    
    result.fromWhitelisted = ValidationContract.isWhitelisted(from);
    result.toWhitelisted = ValidationContract.isWhitelisted(to);
    result.amountValid = ValidationContract.meetsThreshold(amount);
    result.isValid = result.fromWhitelisted && result.toWhitelisted && result.amountValid;
    
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