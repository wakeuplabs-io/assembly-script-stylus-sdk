# MappingNested - Nested Key-Value Storage

The `MappingNested` type provides nested key-value storage functionality with two-level keys in AssemblyScript Stylus smart contracts. It's used for complex data relationships that require two keys to access a value.

## Import

```typescript
import { MappingNested } from "@wakeuplabs/as-stylus";
```

## Syntax

```typescript
MappingNested<KeyType1, KeyType2, ValueType>;
```

## Overview

MappingNested provides:

- Two-level nested key-value storage
- Complex data relationships
- Efficient access to nested structures
- Support for various key combinations
- Gas-efficient nested data retrieval

## Basic Usage

### Declaration and Initialization

```typescript
import { Contract, MappingNested, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class NestedStorage {
  // User allowances: owner -> spender -> amount
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();

  // User settings: user -> setting -> value
  userSettings: MappingNested<Address, Str, boolean> = new MappingNested<Address, Str, boolean>();

  // Game scores: player -> level -> score
  gameScores: MappingNested<Address, U256, U256> = new MappingNested<Address, U256, U256>();
}
```

### Basic Operations

```typescript
import { Contract, External, View, MappingNested, Address, U256 } from "@wakeuplabs/as-stylus";

@Contract
export class AllowanceManager {
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();

  @External
  approve(owner: Address, spender: Address, amount: U256): void {
    // Set nested value with two keys
    this.allowances.set(owner, spender, amount);
  }

  @View
  allowance(owner: Address, spender: Address): U256 {
    // Get nested value with two keys
    return this.allowances.get(owner, spender);
  }

  @External
  transferFrom(from: Address, spender: Address, to: Address, amount: U256): void {
    const currentAllowance = this.allowances.get(from, spender);

    // Update allowance
    const newAllowance = currentAllowance.sub(amount);
    this.allowances.set(from, spender, newAllowance);
  }
}
```

## Key Combinations

```typescript
import { Contract, External, View, MappingNested, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class SimpleMappingNested {
  data: MappingNested<Address, Str, U256> = new MappingNested<Address, Str, U256>();
  flags: MappingNested<Str, U256, boolean> = new MappingNested<Str, U256, boolean>();

  @External
  setValue(user: Address, keyStr, value: U256): void {
    this.data.set(user, key, value);
  }

  @External
  setFlag(categoryStr, id: U256, flag: boolean): void {
    this.flags.set(category, id, flag);
  }

  @View
  getValue(user: Address, key: Str): U256 {
    return this.data.get(user, key);
  }

  @View
  getFlag(categoryStr, id: U256): boolean {
    return this.flags.get(category, id);
  }
}
```

## Supported Key Combinations

```typescript
import { Contract, MappingNested, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class KeyCombinations {
  // Address + Address keys
  addressPairs: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();

  // Address + String keys
  userSettings: MappingNested<Address, Str, boolean> = new MappingNested<Address, Str, boolean>();

  // String + String keys
  stringMatrix: MappingNested<Str, Str, U256> = new MappingNested<Str, Str, U256>();

  // U256 + Address keys
  indexedUsers: MappingNested<U256, Address, Str> = new MappingNested<U256, Address, Str>();
}
```

## Comparison with Mapping

| Feature        | Mapping              | MappingNested                   |
| -------------- | -------------------- | ------------------------------- |
| **Keys**       | Single key           | Two keys                        |
| **Access**     | `mapping.get(key)`   | `mappingNested.get(key1, key2)` |
| **Use Case**   | Simple relationships | Complex relationships           |
| **Gas Cost**   | Lower                | Slightly higher                 |
| **Complexity** | Simple               | Nested data                     |

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation />
