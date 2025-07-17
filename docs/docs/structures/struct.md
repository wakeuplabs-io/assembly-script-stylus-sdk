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
    
    UserManager.currentUser = user;
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
    const transfer = new TokenInfo();
    transfer.amount = amount;
    transfer.recipient = recipient;
    transfer.timestamp = timestamp;
    
    TokenTracker.lastTransfer = transfer;
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
    const profile = new Profile();
    profile.username = username;
    profile.balance = balance;
    profile.joinDate = joinDate;
    
    ProfileManager.userProfile = profile;
  }

  @View
  static getProfile(): Profile {
    return ProfileManager.userProfile;
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
    const stats = new PlayerStats();
    stats.level = level;
    stats.score = score;
    stats.lives = lives;
    
    GameContract.player = stats;
  }

  @View
  static getStats(): PlayerStats {
    return GameContract.player;
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

## Nested Structures

```typescript
class ContactInfo {
  email: String;
  phone: String;
}

class UserProfile {
  name: String;
  age: U256;
  contact: ContactInfo;
}

@Contract
export class NestedExample {
  static user: UserProfile;

  @External
  static setUser(name: String, age: U256, email: String, phone: String): void {
    const contact = new ContactInfo();
    contact.email = email;
    contact.phone = phone;
    
    const profile = new UserProfile();
    profile.name = name;
    profile.age = age;
    profile.contact = contact;
    
    NestedExample.user = profile;
  }
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 