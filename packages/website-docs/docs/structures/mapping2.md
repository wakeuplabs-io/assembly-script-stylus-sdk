# MappingNested - Nested Key-Value Storage

The `MappingNested` type provides nested key-value storage functionality with two-level keys in AssemblyScript Stylus smart contracts. It's used for complex data relationships that require two keys to access a value.

## Syntax

```typescript
MappingNested<KeyType1, KeyType2, ValueType>
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
@Contract
export class NestedStorage {
  // User allowances: owner -> spender -> amount
  static allowances: MappingNested<Address, Address, U256>;
  
  // User settings: user -> setting -> value
  static userSettings: MappingNested<Address, String, Boolean>;
  
  // Game scores: player -> level -> score
  static gameScores: MappingNested<Address, U256, U256>;
}
```

### Basic Operations

```typescript
@Contract
export class AllowanceManager {
  static allowances: MappingNested<Address, Address, U256>;

  @External
  static approve(owner: Address, spender: Address, amount: U256): void {
    // Set nested value with two keys
    allowances.set(owner, spender, amount);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    // Get nested value with two keys
    return allowances.get(owner, spender);
  }

  @External
  static transferFrom(from: Address, spender: Address, to: Address, amount: U256): void {
    const currentAllowance = allowances.get(from, spender);
    
    // Update allowance
    const newAllowance = currentAllowance.sub(amount);
    allowances.set(from, spender, newAllowance);
  }
}
```

## Key Combinations

```typescript
@Contract
export class SimpleMappingNested {
  static data: MappingNested<Address, String, U256>;
  static flags: MappingNested<String, U256, Boolean>;

  @External
  static setValue(user: Address, key: String, value: U256): void {
    data.set(user, key, value);
  }

  @External
  static setFlag(category: String, id: U256, flag: Boolean): void {
    flags.set(category, id, flag);
  }

  @View
  static getValue(user: Address, key: String): U256 {
    return data.get(user, key);
  }

  @View
  static getFlag(category: String, id: U256): Boolean {
    return flags.get(category, id);
  }
}
```

## Supported Key Combinations

```typescript
@Contract
export class KeyCombinations {
  // Address + Address keys
  static addressPairs: MappingNested<Address, Address, U256>;
  
  // Address + String keys  
  static userSettings: MappingNested<Address, String, Boolean>;
  
  // String + String keys
  static stringMatrix: MappingNested<String, String, U256>;
  
  // U256 + Address keys
  static indexedUsers: MappingNested<U256, Address, String>;
}
```

## Comparison with Mapping

| Feature | Mapping | MappingNested |
|---------|---------|----------|
| **Keys** | Single key | Two keys |
| **Access** | `mapping.get(key)` | `mapping2.get(key1, key2)` |
| **Use Case** | Simple relationships | Complex relationships |
| **Gas Cost** | Lower | Slightly higher |
| **Complexity** | Simple | Nested data |

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 