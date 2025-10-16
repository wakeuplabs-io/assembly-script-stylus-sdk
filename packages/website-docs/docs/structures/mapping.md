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
import { Contract, Mapping, Address, U256, I256 } from "@wakeuplabs/as-stylus";

@Contract
export class StorageExample {
  // User balances mapping (Address key, U256 value)
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();

  // Token ownership (U256 key, Address value)
  tokenOwners: Mapping<U256, Address> = new Mapping<U256, Address>();

  // Numeric data storage (U256 key, U256 value)
  counters: Mapping<U256, U256> = new Mapping<U256, U256>();

  // Signed integer mapping (I256 key, U256 value)
  signedData: Mapping<I256, U256> = new Mapping<I256, U256>();
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

## Supported Key-Value Combinations

Currently, the `Mapping` type supports a limited set of key-value combinations. The following table shows which combinations are currently available:

| Key / Value | String | Boolean | U256 | I256 | Address |
| ----------- | ------ | ------- | ---- | ---- | ------- |
| String      | ❌     | ❌      | ❌   | ❌   | ❌      |
| Boolean     | ❌     | ❌      | ❌   | ❌   | ❌      |
| U256        | ❌     | ❌      | ✅   | ❌   | ✅      |
| I256        | ❌     | ❌      | ✅   | ❌   | ✅      |
| Address     | ❌     | ❌      | ✅   | ❌   | ❌      |

### Current State

The `Mapping` type currently supports:

- **U256 keys** with U256 or Address values
- **I256 keys** with U256 or Address values
- **Address keys** with U256 values

Other combinations (String keys/values, Boolean keys/values, etc.) are planned for future releases.

## Working Examples

```typescript
import { Contract, External, View, Mapping, Address, U256, I256 } from "@wakeuplabs/as-stylus";

@Contract
export class MappingTypes {
  // U256 key with U256 value
  balances: Mapping<U256, U256> = new Mapping<U256, U256>();

  // U256 key with Address value
  tokenOwners: Mapping<U256, Address> = new Mapping<U256, Address>();

  // I256 key with U256 value
  signedBalances: Mapping<I256, U256> = new Mapping<I256, U256>();

  // I256 key with Address value
  signedOwners: Mapping<I256, Address> = new Mapping<I256, Address>();

  // Address key with U256 value
  userBalances: Mapping<Address, U256> = new Mapping<Address, U256>();

  @External
  setBalance(userId: U256, balance: U256): void {
    this.balances.set(userId, balance);
  }

  @External
  setTokenOwner(tokenId: U256, owner: Address): void {
    this.tokenOwners.set(tokenId, owner);
  }

  @External
  setSignedBalance(signedId: I256, balance: U256): void {
    this.signedBalances.set(signedId, balance);
  }

  @View
  getBalance(userId: U256): U256 {
    return this.balances.get(userId);
  }

  @View
  getTokenOwner(tokenId: U256): Address {
    return this.tokenOwners.get(tokenId);
  }
}
```

## Future Support

Additional key-value combinations will be added in future releases, including:

- String keys and values
- Boolean keys and values
- Mixed type combinations
- Complex data structures as values

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation />
