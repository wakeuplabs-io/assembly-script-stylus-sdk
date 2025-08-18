# @Internal

The `@Internal` decorator marks a method as callable only from within the same contract. Internal methods cannot be invoked from external transactions and are not included in the contract's ABI.

## Syntax

```typescript
@Internal
static methodName(param1: Type1, param2: Type2): ReturnType {
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
@Contract
export class AdvancedStorage {
  static value: U256;
  static maxValue: U256;

  @Internal
  static validateValue(newValue: U256): boolean {
    return newValue.lt(maxValue);
  }

  @External
  static setValue(newValue: U256): void {
    if (validateValue(newValue)) {
      value = newValue;
    }
  }

  @Internal
  static increment(): void {
    const one = U256Factory.fromString("1");
    value = value.add(one);
  }
}
```

## Rules and Constraints

### Method Requirements
- **Static Methods**: Internal methods must be static
- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Internal Calls**: Can only be called from other methods within the same contract
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support
Supported parameter and return types:

```typescript
@Internal
static examples(
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
static invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### Helper Functions

```typescript
@Contract
export class TokenContract {
  static balances: Mapping<Address, U256>;
  static totalSupply: U256;

  @Internal
  static transferHelper(from: Address, to: Address, amount: U256): boolean {
    const fromBalance = balances.get(from);
    if (fromBalance.lt(amount)) {
      return false;
    }
    
    balances.set(from, fromBalance.sub(amount));
    balances.set(to, balances.get(to).add(amount));
    return true;
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    return transferHelper(msg.sender, to, amount);
  }

  @Internal
  static mintHelper(to: Address, amount: U256): void {
    balances.set(to, balances.get(to).add(amount));
    totalSupply = totalSupply.add(amount);
  }
}
```
