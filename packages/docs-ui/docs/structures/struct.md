# Struct - Custom Data Structures

The `Struct` type allows you to create custom data structures by grouping related data fields together. It's useful for organizing complex data and creating reusable data models.

## Syntax

```typescript
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
class UserInfo {
  id: U256;
  name: String;
  isActive: Boolean;
}

@Contract
export class UserManager {
  static currentUser: UserInfo;

  @External
  static createUser(id: U256, name: String): void {
    const user = new UserInfo();
    user.id = id;
    user.name = name;
    user.isActive = true;
    
    currentUser = user;
  }

  @View
  static getUser(): UserInfo {
    return UserManager.currentUser;
  }
}
```

### Struct with Multiple Fields

```typescript
class TokenInfo {
  amount: U256;
  recipient: Address;
  timestamp: U256;
}

@Contract
export class TokenTracker {
  static lastTransfer: TokenInfo;

  @External
  static recordTransfer(amount: U256, recipient: Address, timestamp: U256): void {
    const transfer = StructFactory.create<TokenInfo>([
      amount,
      recipient,
      timestamp,
    ]);
    
    lastTransfer = transfer;
  }

  @View
  static getLastTransfer(): TokenInfo {
    return TokenTracker.lastTransfer;
  }
}
```

## Common Patterns

### Configuration Data

```typescript
class Config {
  maxSupply: U256;
  ownerAddress: Address;
  isPaused: Boolean;
}

@Contract
export class ConfigContract {
  static settings: Config;

  @External
  static updateConfig(maxSupply: U256, owner: Address, paused: Boolean): void {
    const config = new Config();
    config.maxSupply = maxSupply;
    config.ownerAddress = owner;
    config.isPaused = paused;
    
    ConfigContract.settings = config;
  }
}
```

### User Profile

```typescript
class Profile {
  username: String;
  balance: U256;
  joinDate: U256;
}

@Contract
export class ProfileManager {
  static userProfile: Profile;

  @External
  static createProfile(username: String, balance: U256, joinDate: U256): void {
    const profile = StructFactory.create<Profile>([
      username,
      balance,
      joinDate,
    ]);
    userProfile = profile;
  }

  @View
  static getProfile(): Profile {
    return userProfile;
  }
}
```

### Game Data

```typescript
class PlayerStats {
  level: U256;
  score: U256;
  lives: U256;
}

@Contract
export class GameContract {
  static player: PlayerStats;

  @External
  static updateStats(level: U256, score: U256, lives: U256): void {
    const stats = StructFactory.create<PlayerStats>([
      level,
      score,
      lives
    ])
    player = stats;
  }

  @View
  static getStats(): PlayerStats {
    return player;
  }
}
```

## Supported Field Types

```typescript
class AllTypes {
  numberField: U256;        // ✅ Numbers
  signedField: I256;        // ✅ Signed numbers
  addressField: Address;    // ✅ Addresses
  textField: String;        // ✅ Text
  flagField: Boolean;       // ✅ True/false
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 