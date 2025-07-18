# Boolean - Logical Value Type

The `Boolean` type represents logical true/false values in AssemblyScript Stylus smart contracts. It's essential for conditional logic, access control, and state flags.

## Overview

Boolean provides:
- True/false logical values
- Conditional logic operations
- State flag management
- Access control patterns
- Simple comparison results

## Basic Usage

### Creating Boolean Values

```typescript
// Direct boolean values
const isActive: boolean = true;
const isComplete: boolean = false;

// From comparisons
const isGreater: boolean = valueA.greaterThan(valueB);
const isEqual: boolean = addressA.equals(addressB);
```

### Basic Usage

```typescript
@Contract
export class SimpleFlag {
  static isEnabled: boolean;

  @External
  static enable(): void {
    SimpleFlag.isEnabled = true;
  }

  @External
  static disable(): void {
    SimpleFlag.isEnabled = false;
  }

  @View
  static getStatus(): boolean {
    return SimpleFlag.isEnabled;
  }
}
```

## Logical Operations

```typescript
@Contract
export class BooleanLogic {
  static flag1: boolean;
  static flag2: boolean;

  @View
  static checkBoth(): boolean {
    return BooleanLogic.flag1 && BooleanLogic.flag2;
  }

  @View
  static checkEither(): boolean {
    return BooleanLogic.flag1 || BooleanLogic.flag2;
  }

  @View
  static checkNot(): boolean {
    return !BooleanLogic.flag1;
  }
}
```

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 