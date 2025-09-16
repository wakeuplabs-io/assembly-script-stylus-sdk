# @External

The `@External` decorator marks a method as publicly callable from outside the contract. External methods can be invoked through transactions and are included in the contract's ABI.

## Syntax

```typescript
@External
methodName(param1: Type1, param2: Type2): ReturnType {
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
import { Contract, External, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class SimpleStorage {
  value: U256;

  @External
  setValue(newValue: U256): void {
    this.value = newValue;
  }

  @External
  increment(): void {
    const one = U256Factory.fromString("1");
    this.value = value.add(one);
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
@External
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
@External
invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### With Return Values

```typescript
import { Contract, External, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class Calculator {
  @External
  add(a: U256, b: U256): U256 {
    return a.add(b);
  }

  @External
  subtract(a: U256, b: U256): U256 {
    return a.sub(b);
  }

  @External
  double(value: U256): U256 {
    const two = U256Factory.fromString("2");
    return value.add(value);
  }
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation />
