# @Public

The `@Public` decorator marks a method as publicly callable from both outside the contract AND from within the contract itself. Public methods can be invoked through transactions, called internally by other contract methods, and are included in the contract's ABI.

## Syntax

```typescript
@Public
methodName(param1: Type1, param2: Type2): ReturnType {
  // Method implementation
}
```

## Purpose

The `@Public` decorator:

- **Dual Access**: Makes methods callable from both external transactions AND internal contract methods
- **ABI Generation**: Includes the method in the contract's ABI
- **State Modification**: Can read and modify contract state
- **Flexible Usage**: Unlike @External, can be used as both public interface and internal helper

## Basic Example

```typescript
import { Contract, Public, U256, Address } from "@wakeuplabs/as-stylus";

@Contract
export class PublicStorage {
  value: U256;
  owner: Address;

  @Public
  setValue(newValue: U256): void {
    this.value = newValue;
  }

  @Public
  getValue(): U256 {
    return this.value;
  }

  @Public
  transferOwnership(newOwner: Address): void {
    this.owner = newOwner;
  }
}
```

## Rules and Constraints

### Method Requirements

- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support

Supported parameter and return types:

```typescript
@Public
examples(
  uintValue: U256,          // ✅ Unsigned 256-bit integer
  intValue: I256,           // ✅ Signed 256-bit integer
  addressValue: Address,    // ✅ Ethereum address
  stringValue: String,      // ✅ Dynamic string
  boolValue: Boolean        // ✅ Boolean value
): U256 {                   // ✅ Any supported type as return
  // Implementation
  return uintValue;
}

// ❌ Unsupported types
@Public
invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### State Management

```typescript
import { Contract, Public, U256, Address, Mapping, String } from "@wakeuplabs/as-stylus";

@Contract
export class UserRegistry {
  users: Mapping<Address, String>;
  userCount: U256;

  @Public
  registerUser(name: String): void {
    this.users.set(msg.sender, name);
    this.userCount = this.userCount.add(U256Factory.fromString("1"));
  }

  @Public
  updateUserName(newName: String): void {
    this.users.set(msg.sender, newName);
  }

  @Public
  getUserName(userAddress: Address): String {
    return this.users.get(userAddress);
  }

  @Public
  getTotalUsers(): U256 {
    return this.userCount;
  }
}
```

### Complex Operations

```typescript
import {
  Contract,
  U256Factory,
  Public,
  U256,
  Address,
  Mapping,
  String,
} from "@wakeuplabs/as-stylus";

@Contract
export class MultiFunctionContract {
  data: U256;
  history: Mapping<U256, U256>;

  @Public
  performCalculation(input: U256): U256 {
    const result = input.mul(U256Factory.fromString("2"));
    this.data = result;
    return result;
  }

  @Public
  batchOperation(values: U256[]): U256 {
    let sum = U256Factory.fromString("0");
    for (let i = 0; i < values.length; i++) {
      sum = sum.add(values[i]);
    }
    this.data = sum;
    return sum;
  }

  @Public
  storeInHistory(key: U256, value: U256): void {
    this.history.set(key, value);
  }

  @Public
  retrieveFromHistory(key: U256): U256 {
    return this.history.get(key);
  }
}
```

## @Public vs @External

While both decorators make methods publicly callable, there's a key difference:

- **@Public**: Can be called both externally (from transactions) AND internally (from other contract methods)
- **@External**: Can ONLY be called externally (from transactions), NOT internally from other contract methods
- **Use Case**: Use @Public when you need the method to be callable from both external transactions and internal contract logic
- **Use Case**: Use @External when you want to restrict the method to only external calls
