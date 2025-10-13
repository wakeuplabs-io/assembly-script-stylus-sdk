# Inheritance

The AssemblyScript Stylus SDK supports single inheritance, allowing contracts to extend other contracts using standard TypeScript/AssemblyScript syntax. This enables code reuse, modular design, and familiar object-oriented programming patterns.

## Overview

Inheritance in the SDK:

- **Code Reuse**: Child contracts inherit methods, storage, events, structs, and errors from parent contracts
- **Method Overriding**: Child contracts can override parent methods with the same signature
- **Constructor Chaining**: Parent constructors are called before child constructors
- **Storage Layout Compatibility**: Maintains Solidity-compatible storage layout (parent storage first, then child storage)

## Syntax

```typescript
// Parent contract
@Contract
export class ParentContract {
  // Parent implementation
}

// Child contract extends parent
@Contract
export class ChildContract extends ParentContract {
  // Child implementation
}
```

## Basic Example

### Parent Contract

```typescript
import { Contract, External, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class Parent {
  sum: U256;

  constructor(init: U256) {
    this.sum = init;
  }

  @External
  setValue(a: U256, b: U256): void {
    this.sum = a.add(b);
  }

  @External
  getValue(): U256 {
    return this.sum;
  }
}
```

### Child Contract

```typescript
import { Contract, External, U256 } from "@wakeuplabs/as-stylus";
import { Parent } from "./parent.js";

@Contract
export class Child extends Parent {
  constructor(init: U256) {
    super(init); // Call parent constructor
  }

  @External
  getSum(): U256 {
    return this.sum; // Access parent storage
  }
}
```

## How Inheritance Works

### 1. Method Inheritance

Child contracts automatically inherit all `@External`, `@Public`, and `@Internal` methods from the parent.

```typescript
@Contract
export class Parent {
  @External
  parentMethod(): U256 {
    return U256Factory.fromString("100");
  }
}

@Contract
export class Child extends Parent {
  // Inherits parentMethod() automatically
  // Can be called on instances of Child
}
```

### 2. Storage Inheritance

Parent storage variables occupy the first storage slots, followed by child storage variables. This maintains Solidity-compatible storage layout.

```typescript
@Contract
export class Parent {
  value1: U256; // Slot 0
  value2: U256; // Slot 1
}

@Contract
export class Child extends Parent {
  value3: U256; // Slot 2 (after parent storage)
  value4: U256; // Slot 3
}
```

### 3. Constructor Chaining

Parent constructors run first, then child constructors execute. Always call `super()` in the child constructor to initialize the parent.

```typescript
@Contract
export class Parent {
  value: U256;

  constructor(initialValue: U256) {
    this.value = initialValue;
  }
}

@Contract
export class Child extends Parent {
  multiplier: U256;

  constructor(initialValue: U256, mult: U256) {
    super(initialValue); // Initialize parent first
    this.multiplier = mult; // Then initialize child
  }
}
```

## Method Overriding

Child contracts can override parent methods by declaring a method with the exact same signature.

```typescript
@Contract
export class Parent {
  @External
  calculate(): U256 {
    return U256Factory.fromString("50");
  }
}

@Contract
export class Child extends Parent {
  @External
  calculate(): U256 {
    // Override parent method
    return U256Factory.fromString("100");
  }
}
```

When a method is overridden, the child's implementation is used in the final contract.

## Calling Parent Methods

### Internal Methods

Child contracts can call `@Internal` methods from the parent directly:

```typescript
@Contract
export class Parent {
  @Internal
  add(a: U256, b: U256): U256 {
    return a.add(b);
  }
}

@Contract
export class Child extends Parent {
  @External
  calculate(x: U256, y: U256): U256 {
    // Call parent's internal method
    return this.add(x, y);
  }
}
```

## Rules and Constraints

### Single Inheritance Only

Currently, only single inheritance is supported. A contract can extend only one parent contract.

```typescript
// ✅ Valid - Single inheritance
@Contract
export class Child extends Parent {
  // Implementation
}

// ❌ Invalid - Multiple inheritance not supported
@Contract
export class Child extends Parent1, Parent2 { // Error
  // Implementation
}
```

### Both Parent and Child Must Use @Contract

Both the parent and child classes must be decorated with `@Contract`.

```typescript
// ✅ Valid
@Contract
export class Parent {}

@Contract
export class Child extends Parent {}

// ❌ Invalid - Parent missing @Contract
export class Parent {}

@Contract
export class Child extends Parent {} // Error
```

### Import Requirements

When importing parent contracts, use the `.ts` extension in the import path:

```typescript
import { Parent } from "./parent.ts"; // ✅ Correct
```

### Method Signature Matching

When overriding methods, the signature must match exactly (same parameter types and return type):

```typescript
@Contract
export class Parent {
  @External
  calculate(value: U256): U256 {
    return value;
  }
}

// ✅ Valid - Exact signature match
@Contract
export class Child1 extends Parent {
  @External
  calculate(value: U256): U256 {
    return value.add(value);
  }
}

// ❌ Invalid - Different signature
@Contract
export class Child2 extends Parent {
  @External
  calculate(value: U256, extra: U256): U256 {
    // Error: signature mismatch
    return value.add(extra);
  }
}
```

## Inherited Components

When a contract extends a parent, it inherits:

- **Methods**: All `@External`, `@Public`, and `@Internal` methods
- **Storage**: All storage variables (placed before child storage)
- **Events**: All `@Event` decorated events
- **Structs**: All custom struct definitions
- **Errors**: All `@Error` decorated custom errors

## Best Practices

### 1. Use Internal Methods for Shared Logic

Extract common logic into `@Internal` methods that both parent and child can use:

```typescript
@Contract
export class Parent {
  @Internal
  validateAmount(amount: U256): bool {
    const zero = U256Factory.create();
    return amount.gt(zero);
  }

  @External
  deposit(amount: U256): void {
    if (!this.validateAmount(amount)) {
      // Handle error
    }
    // Process deposit
  }
}
```

### 2. Initialize Parents in Constructors

Always call `super()` to properly initialize parent state:

```typescript
@Contract
export class Child extends Parent {
  constructor(value: U256) {
    super(value); // Required for parent initialization
    // Child initialization follows
  }
}
```

### 3. Document Override Behavior

When overriding methods, document the differences in behavior:

```typescript
@Contract
export class Child extends Parent {
  /**
   * Overrides parent calculate() method.
   * Returns double the value instead of the original calculation.
   */
  @External
  calculate(value: U256): U256 {
    return value.add(value);
  }
}
```

### 4. Organize Contracts Logically

Structure parent contracts to be reusable across multiple children:

```typescript
// Base contract with common functionality
@Contract
export class BaseToken {
  // Common token logic
}

// Specialized implementations
@Contract
export class RewardToken extends BaseToken {
  // Reward-specific logic
}

@Contract
export class GovernanceToken extends BaseToken {
  // Governance-specific logic
}
```
