# @Internal

The `@Internal` decorator marks a method as callable only from within the same contract. Internal methods cannot be invoked from external transactions and are not included in the contract's ABI.

## Syntax

```typescript
@Internal
methodName(param1: Type1, param2: Type2): ReturnType {
  // Method implementation
}
```

## Purpose

The `@Internal` decorator:

- **Private Interface**: Makes methods callable only from within the contract
- **ABI Exclusion**: Excludes the method from the contract's ABI
- **State Access**: Can read and modify contract state
- **Code Organization**: Helps organize contract logic into reusable internal functions

## Basic Example

```typescript
import { Contract, U256, Internal, External, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class AdvancedStorage {
  value: U256;
  maxValue: U256;

  @Internal
  validateValue(newValue: U256): boolean {
    return newValue.lt(this.maxValue);
  }

  @External
  setValue(newValue: U256): void {
    if (validateValue(newValue)) {
      this.value = newValue;
    }
  }

  @Internal
  increment(): void {
    const one = U256Factory.fromString("1");
    this.value = value.add(one);
  }
}
```

## Rules and Constraints

### Method Requirements

- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Internal Calls**: Can only be called from other methods within the same contract
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support

Supported parameter and return types:

```typescript
@Internal
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
@Internal
invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### Helper Functions

```typescript
import {
  Contract,
  Mapping,
  Address,
  U256,
  Internal,
  External,
  U256Factory,
} from "@wakeuplabs/as-stylus";

@Contract
export class TokenContract {
  balances: Mapping<Address, U256>;
  totalSupply: U256;

  @Internal
  transferHelper(from: Address, to: Address, amount: U256): boolean {
    const fromBalance = this.balances.get(from);
    if (fromBalance.lt(amount)) {
      return false;
    }

    this.balances.set(from, fromBalance.sub(amount));
    this.balances.set(to, this.balances.get(to).add(amount));
    return true;
  }

  @External
  transfer(to: Address, amount: U256): boolean {
    return transferHelper(msg.sender, to, amount);
  }

  @Internal
  mintHelper(to: Address, amount: U256): void {
    this.balances.set(to, this.balances.get(to).add(amount));
    this.totalSupply = this.totalSupply.add(amount);
  }
}
```
