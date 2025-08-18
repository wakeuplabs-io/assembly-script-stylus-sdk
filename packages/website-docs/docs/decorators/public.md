# @Public

The `@Public` decorator marks a method as publicly callable from both outside the contract AND from within the contract itself. Public methods can be invoked through transactions, called internally by other contract methods, and are included in the contract's ABI.

## Syntax

```typescript
@Public
static methodName(param1: Type1, param2: Type2): ReturnType {
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
@Contract
export class PublicStorage {
  static value: U256;
  static owner: Address;

  @Public
  static setValue(newValue: U256): void {
    value = newValue;
  }

  @Public
  static getValue(): U256 {
    return value;
  }

  @Public
  static transferOwnership(newOwner: Address): void {
    owner = newOwner;
  }
}
```

## Rules and Constraints

### Method Requirements
- **Static Methods**: Public methods must be static
- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support
Supported parameter and return types:

```typescript
@Public
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
@Public
static invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### State Management

```typescript
@Contract
export class UserRegistry {
  static users: Mapping<Address, String>;
  static userCount: U256;

  @Public
  static registerUser(name: String): void {
    users.set(msg.sender, name);
    userCount = userCount.add(U256Factory.fromString("1"));
  }

  @Public
  static updateUserName(newName: String): void {
    users.set(msg.sender, newName);
  }

  @Public
  static getUserName(userAddress: Address): String {
    return users.get(userAddress);
  }

  @Public
  static getTotalUsers(): U256 {
    return userCount;
  }
}
```

### Complex Operations

```typescript
@Contract
export class MultiFunctionContract {
  static data: U256;
  static history: Mapping<U256, U256>;

  @Public
  static performCalculation(input: U256): U256 {
    const result = input.mul(U256Factory.fromString("2"));
    data = result;
    return result;
  }

  @Public
  static batchOperation(values: U256[]): U256 {
    let sum = U256Factory.fromString("0");
    for (let i = 0; i < values.length; i++) {
      sum = sum.add(values[i]);
    }
    data = sum;
    return sum;
  }

  @Public
  static storeInHistory(key: U256, value: U256): void {
    history.set(key, value);
  }

  @Public
  static retrieveFromHistory(key: U256): U256 {
    return history.get(key);
  }
}
```

## @Public vs @External

While both decorators make methods publicly callable, there's a key difference:

- **@Public**: Can be called both externally (from transactions) AND internally (from other contract methods)
- **@External**: Can ONLY be called externally (from transactions), NOT internally from other contract methods
- **Use Case**: Use @Public when you need the method to be callable from both external transactions and internal contract logic
- **Use Case**: Use @External when you want to restrict the method to only external calls
