# Struct - Custom Data Structures

The `Struct` type allows you to create custom data structures by grouping related data fields together. It's useful for organizing complex data and creating reusable data models.

## Import

```typescript
import { StructTemplate, StructFactory, Struct } from "@wakeuplabs/as-stylus";
```

## Syntax

```typescript
@StructTemplate
class StructName {
  field1: Type1;
  field2: Type2;
  field3: Type3;
}
```

## Overview

Struct provides:

- Custom data grouping
- Related field organization
- Reusable data models
- Type-safe field access
- Memory-efficient storage

## Basic Usage

### Simple Struct

```typescript
import {
  Contract,
  StructTemplate,
  External,
  View,
  U256,
  String,
  StructFactory,
} from "@wakeuplabs/as-stylus";

@StructTemplate
class UserInfo {
  id: U256;
  name: String;
  isActive: boolean;
}

@Contract
export class UserManager {
  currentUser: Struct<UserInfo>;

  @External
  createUser(id: U256, name: String): void {
    this.currentUser.id = id;
    this.currentUser.name = name;
    this.currentUser.isActive = true;
  }

  @View
  getUser(): UserInfo {
    return this.currentUser;
  }
}
```

### Struct with Multiple Fields

```typescript
import {
  Contract,
  Struct,
  External,
  View,
  U256,
  Address,
  StructFactory,
} from "@wakeuplabs/as-stylus";

class TokenInfo {
  amount: U256;
  recipient: Address;
  timestamp: U256;
}

@Contract
export class TokenTracker {
  lastTransfer: Struct<TokenInfo>;

  @External
  recordTransfer(amount: U256, recipient: Address, timestamp: U256): void {
    this.lastTransfer.amount = amount;
    this.lastTransfer.recipient = recipient;
    this.lastTransfer.timestamp = timestamp;
  }

  @View
  getLastTransfer(): TokenInfo {
    return this.lastTransfer;
  }
}
```

## Common Patterns

### Configuration Data

```typescript
import { Contract, Struct, External, U256, Address } from "@wakeuplabs/as-stylus";

class Config {
  maxSupply: U256;
  ownerAddress: Address;
  isPaused: boolean;
}

@Contract
export class ConfigContract {
  settings: TokenInfo<Config>;

  @External
  updateConfig(maxSupply: U256, owner: Address, paused: boolean): void {
    this.settings.maxSupply = maxSupply;
    this.settings.ownerAddress = owner;
    this.settings.isPaused = paused;
  }
}
```

### Game Data

```typescript
import { Contract, External, Struct, View, U256, StructFactory } from "@wakeuplabs/as-stylus";

class PlayerStats {
  level: U256;
  score: U256;
  lives: U256;
}

@Contract
export class GameContract {
  player: Struct<PlayerStats>;

  @External
  updateStats(level: U256, score: U256, lives: U256): void {
    this.player.level = level;
    this.player.score = score;
    this.player.lives = lives;
  }

  @View
  getStats(): PlayerStats {
    return this.player;
  }
}
```

## Supported Field Types

```typescript
import { U256, I256, Address, String } from "@wakeuplabs/as-stylus";

class AllTypes {
  numberField: U256; // ✅ Numbers
  signedField: I256; // ✅ Signed numbers
  addressField: Address; // ✅ Addresses
  textField: String; // ✅ Text
  flagField: boolean; // ✅ True/false
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation />
