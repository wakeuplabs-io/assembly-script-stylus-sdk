# Mapping - Key-Value Storage

The `Mapping` type provides key-value storage functionality in AssemblyScript Stylus smart contracts. It's the primary data structure for associating values with unique keys, similar to hash maps or dictionaries.

## Syntax

```typescript
Mapping<KeyType, ValueType>
```

## Overview

Mapping provides:
- Key-value pair storage
- O(1) access time for get/set operations
- Support for various key and value types
- Persistent storage across contract calls
- Gas-efficient data retrieval

## Basic Usage

### Declaration and Initialization

```typescript
@Contract
export class StorageExample {
  // User balances mapping
  static balances: Mapping<Address, U256>;
  
  // Configuration flags
  static settings: Mapping<String, Boolean>;
  
  // Numeric data storage
  static counters: Mapping<U256, U256>;
}
```

### Basic Operations

```typescript
@Contract
export class MappingBasics {
  static userScores: Mapping<Address, U256>;

  @External
  static setScore(user: Address, score: U256): void {
    // Set value for key
    MappingBasics.userScores.set(user, score);
  }

  @View
  static getScore(user: Address): U256 {
    // Get value for key
    return MappingBasics.userScores.get(user);
  }

  @External
  static updateScore(user: Address, newScore: U256): void {
    // Update existing value
    MappingBasics.userScores.set(user, newScore);
  }
}
```

## Different Key-Value Types

```typescript
@Contract
export class MappingTypes {
  static addressToNumber: Mapping<Address, U256>;
  static stringToFlag: Mapping<String, Boolean>;
  static numberToText: Mapping<U256, String>;

  @External
  static setAddressValue(addr: Address, value: U256): void {
    MappingTypes.addressToNumber.set(addr, value);
  }

  @External
  static setStringFlag(key: String, flag: Boolean): void {
    MappingTypes.stringToFlag.set(key, flag);
  }

  @View
  static getAddressValue(addr: Address): U256 {
    return MappingTypes.addressToNumber.get(addr);
  }

  @View
  static getStringFlag(key: String): Boolean {
    return MappingTypes.stringToFlag.get(key);
  }
}

## Supported Key Types

```typescript
@Contract
export class KeyTypes {
  static addressMapping: Mapping<Address, U256>;     // ✅ Address keys
  static stringMapping: Mapping<String, Boolean>;    // ✅ String keys  
  static numberMapping: Mapping<U256, Address>;      // ✅ U256 keys
}
```

## Supported Value Types

```typescript
@Contract
export class ValueTypes {
  static numberValues: Mapping<Address, U256>;       // ✅ U256 values
  static booleanValues: Mapping<String, Boolean>;    // ✅ Boolean values
  static addressValues: Mapping<U256, Address>;      // ✅ Address values
  static stringValues: Mapping<Address, String>;     // ✅ String values
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 