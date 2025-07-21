# @External

The `@External` decorator marks a method as publicly callable from outside the contract. External methods can be invoked through transactions and are included in the contract's ABI.

## Syntax

```typescript
@External
static methodName(param1: Type1, param2: Type2): ReturnType {
  // Method implementation
}
```

## Purpose

The `@External` decorator:

- **Public Interface**: Makes methods callable from external transactions
- **ABI Generation**: Includes the method in the contract's ABI
- **State Modification**: Can read and modify contract state

## Basic Example

```typescript
@Contract
export class SimpleStorage {
  static value: U256;

  @External
  static setValue(newValue: U256): void {
    value = newValue;
  }

  @External
  static increment(): void {
    const one = U256Factory.fromString("1");
    value = value.add(one);
  }
}
```

## Rules and Constraints

### Method Requirements
- **Static Methods**: External methods must be static
- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support
Supported parameter and return types:

```typescript
@External
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
@External
static invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### With Return Values

```typescript
@Contract
export class Calculator {
  @External
  static add(a: U256, b: U256): U256 {
    return a.add(b);
  }

  @External
  static subtract(a: U256, b: U256): U256 {
    return a.sub(b);
  }

  @External
  static double(value: U256): U256 {
    const two = U256Factory.fromString("2");
    return value.add(value);
  }
}
```



---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 