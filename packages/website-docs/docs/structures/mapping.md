# Mapping - Key-Value Storage

The `Mapping` type provides key-value storage functionality in AssemblyScript Stylus smart contracts. It's the primary data structure for associating values with unique keys, similar to hash maps or dictionaries.

## Import

```typescript
import { Mapping } from "@wakeuplabs/as-stylus";
```

## Syntax

```typescript
Mapping<KeyType, ValueType>;
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
import { Contract, Mapping, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class StorageExample {
  // User balances mapping
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();

  // Configuration flags
  settings: Mapping<Str, boolean> = new Mapping<Str, boolean>();

  // Numeric data storage
  counters: Mapping<U256, U256> = new Mapping<U256, U256>();
}
```

### Basic Operations

```typescript
import { Contract, External, View, Mapping, Address, U256 } from "@wakeuplabs/as-stylus";

@Contract
export class MappingBasics {
  userScores: Mapping<Address, U256> = new Mapping<Address, U256>();

  @External
  setScore(user: Address, score: U256): void {
    // Set value for key
    this.userScores.set(user, score);
  }

  @View
  getScore(user: Address): U256 {
    // Get value for key
    return this.userScores.get(user);
  }

  @External
  updateScore(user: Address, newScore: U256): void {
    // Update existing value
    this.userScores.set(user, newScore);
  }
}
```

## Different Key-Value Types

```typescript
import { Contract, External, View, Mapping, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class MappingTypes {
  addressToNumber: Mapping<Address, U256> = new Mapping<Address, U256>();
  stringToFlag: Mapping<Str, boolean> = new Mapping<Str, boolean>();
  numberToText: Mapping<U256, Str> = new Mapping<U256, Str>();

  @External
  setAddressValue(addr: Address, value: U256): void {
    this.addressToNumber.set(addr, value);
  }

  @External
  setStringFlag(keyStr, flag: boolean): void {
    this.stringToFlag.set(key, flag);
  }

  @View
  getAddressValue(addr: Address): U256 {
    return this.addressToNumber.get(addr);
  }

  @View
  getStringFlag(key: Str): boolean {
    return this.stringToFlag.get(key);
  }
}
```

## Supported Key Types

```typescript
import { Contract, Mapping, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class KeyTypes {
  addressMapping: Mapping<Address, U256> = new Mapping<Address, U256>(); // ✅ Address keys
  stringMapping: Mapping<Str, boolean> = new Mapping<Str, boolean>(); // ✅ String keys
  numberMapping: Mapping<U256, Address> = new Mapping<U256, Address>(); // ✅ U256 keys
}
```

## Supported Value Types

```typescript
import { Contract, Mapping, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class ValueTypes {
  numberValues: Mapping<Address, U256> = new Mapping<Address, U256>(); // ✅ U256 values
  booleanValues: Mapping<Str, boolean> = new Mapping<Str, boolean>(); // ✅ Boolean values
  addressValues: Mapping<U256, Address> = new Mapping<U256, Address>(); // ✅ Address values
  stringValues: Mapping<Address, Str> = new Mapping<Address, Str>(); // ✅ String values
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation />
