# Boolean - Logical Value Type

The `boolean` type represents logical true/false values in AssemblyScript Stylus smart contracts. It's essential for conditional logic, access control, and state flags.

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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// Direct boolean values
const isActive: boolean = true;
const isComplete: boolean = false;

// From comparisons
const isGreater: boolean = valueA > valueB;
const isEqual: boolean = addressA.equals(addressB);
```

## Logical Operations

```typescript
// AND: both must be true
let result1: boolean = true && false;  // false
let result2: boolean = true && true;   // true

// OR: at least one must be true  
let result3: boolean = true || false;  // true
let result4: boolean = false || false; // false

// NOT: inverts the value
let result5: boolean = !true;  // false
let result6: boolean = !false; // true

// In contracts
@View
static checkAccess(): boolean {
  return isAdmin && isActive; // true only if both are true
}

@View
static canEdit(): boolean {
  return isOwner || isModerator; // true if either is true
}
```
### Simple Examples

```typescript
@Contract
export class BooleanExamples {
  static isActive: boolean = true;
  static isPaused: boolean = false;

  @External
  static toggleActive(): void {
    isActive = !isActive;
  }

  @External
  static setPaused(paused: boolean): void {
    isPaused = paused;
  }

  @View
  static getStatus(): boolean {
    return isActive && !isPaused;
  }

  @View
  static checkCondition(value: U256): boolean {
    return value > U256.from(100);
  }
}
```
