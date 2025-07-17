# @Contract Decorator

The `@Contract` decorator is the foundational decorator that marks a TypeScript class as a smart contract. Every smart contract must have exactly one class decorated with `@Contract`.

## Syntax

```typescript
@Contract
export class MyContract {
  // Contract implementation
}
```

## Purpose

The `@Contract` decorator:

- **Identifies Contract Classes**: Tells the compiler which class represents the smart contract
- **Enables Contract Features**: Allows the use of other decorators like `@External`, `@View`, etc.
- **Generates Entry Points**: Creates the necessary WASM entry points for Stylus execution
- **ABI Generation**: Enables automatic ABI (Application Binary Interface) generation

## Rules and Constraints

### Single Contract Rule
- **One per file**: Each contract file must contain exactly one `@Contract` decorated class
- **No multiple contracts**: Multiple `@Contract` decorators in the same file will cause compilation errors

```typescript
// ✅ Valid - Single contract
@Contract
export class MyContract {
  // Implementation
}

// ❌ Invalid - Multiple contracts
@Contract
export class FirstContract { }

@Contract  // Error: Multiple contracts not allowed
export class SecondContract { }
```

### Class Structure
- **Export Required**: The contract class must be exported
- **Static Members**: Contract storage and methods should typically be static
- **Constructor Support**: Optional constructor for initialization logic

## Basic Example

```typescript
@Contract
export class SimpleStorage {
  static value: U256;

  constructor() {
    value = U256Factory.create();
  }

  @External
  static setValue(newValue: U256): void {
    value = newValue;
  }

  @View
  static getValue(): U256 {
    return value;
  }
}
```

## Advanced Usage

### With Constructor

```typescript
@Contract
export class Counter {
  static count: U256;

  constructor() {
    Counter.count = U256Factory.create();
  }

  @External
  static increment(): void {
    Counter.count = Counter.count.add(U256Factory.fromString("1"));
  }

  @View
  static getCount(): U256 {
    return Counter.count;
  }
}
```

## Compilation Process

When you use `@Contract`, the compiler:

1. **Validates Structure**: Ensures only one contract per file
2. **Processes Methods**: Identifies `@External`, `@View`, and other decorated methods
3. **Generates Entry Points**: Creates WASM entry points for external methods
4. **Creates ABI**: Generates JSON ABI for external interaction
5. **Optimizes Code**: Performs AssemblyScript optimizations for Stylus



---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 