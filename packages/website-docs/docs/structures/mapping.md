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
import { Contract, Mapping, Address, U256, I256, Str } from "@wakeuplabs/as-stylus";

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

  // String key with String value
  stringStorage: Mapping<string, string> = new Mapping<string, string>();

  // Boolean key with Address value
  boolOwners: Mapping<boolean, Address> = new Mapping<boolean, Address>();

  // Address key with String value
  userNames: Mapping<Address, Str> = new Mapping<Address, Str>();

  // String key with U256 value
  stringBalances: Mapping<string, U256> = new Mapping<string, U256>();

  // All combinations are supported!
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

The `Mapping` type supports **all combinations** of basic types as keys and values. The following table shows all supported combinations:

| Key / Value | String | Boolean | U256 | I256 | Address |
| ----------- | ------ | ------- | ---- | ---- | ------- |
| String      | ✅     | ✅      | ✅   | ✅   | ✅      |
| Boolean     | ✅     | ✅      | ✅   | ✅   | ✅      |
| U256        | ✅     | ✅      | ✅   | ✅   | ✅      |
| I256        | ✅     | ✅      | ✅   | ✅   | ✅      |
| Address     | ✅     | ✅      | ✅   | ✅   | ✅      |

### All Combinations Supported

The `Mapping` type supports all 25 combinations of the following types:

**Supported Key Types:**
- `String` (or `Str`)
- `Boolean`
- `U256`
- `I256`
- `Address`

**Supported Value Types:**
- `String` (or `Str`)
- `Boolean`
- `U256`
- `I256`
- `Address`

You can use any of these types as both keys and values in any combination.

## Mappings with Structs (Beta)

:::caution BETA FEATURE

Mappings with struct values are currently in **beta**. While functional, this feature may have limitations and edge cases.

:::

The `Mapping` type supports using structs as values, allowing you to store complex data structures in mappings. This enables more sophisticated data organization while maintaining efficient storage.

### Basic Usage with Structs

```typescript
import {
  Address,
  Contract,
  External,
  Mapping,
  StructFactory,
  StructTemplate,
  View,
  Str,
  U256,
  Struct,
} from "@wakeuplabs/as-stylus";

@StructTemplate
export class UserInfo {
  age: U256;
  address: Address;
  isActive: boolean;
  name: Str;
}

@Contract
export class UserRegistry {
  // Address key -> UserInfo struct value
  users: Mapping<Address, UserInfo> = new Mapping<Address, UserInfo>();

  @External
  setUserData(name: Str, age: U256, isActive: boolean, userAddress: Address): void {
    const userInfo = StructFactory.create<UserInfo>({
      age: age,
      address: userAddress,
      isActive: isActive,
      name: name,
    });
    this.users.set(userAddress, userInfo);
  }

  @View
  getUserInfo(userAddress: Address): UserInfo {
    return this.users.get(userAddress);
  }

  @External
  updateUserAge(userAddress: Address, newAge: U256): void {
    const user = this.users.get(userAddress);
    user.age = newAge;
    this.users.set(userAddress, user);
  }
}
```

### Supported Key Types with Struct Values

You can use any of the supported key types with struct values:

- `Mapping<Address, MyStruct>` - Address key with struct value
- `Mapping<U256, MyStruct>` - U256 key with struct value
- `Mapping<I256, MyStruct>` - I256 key with struct value
- `Mapping<string, MyStruct>` - String key with struct value
- `Mapping<boolean, MyStruct>` - Boolean key with struct value



## Working Examples

Here are examples demonstrating various key-value combinations:

### Real-World Examples

```typescript
import { Contract, External, View, Mapping, Address, U256, Str } from "@wakeuplabs/as-stylus";

@Contract
export class TokenRegistry {
  // Token ID (U256) -> Owner (Address)
  owners: Mapping<U256, Address> = new Mapping<U256, Address>();

  // Owner (Address) -> Balance (U256)
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();

  // Token ID (U256) -> Metadata (String)
  metadata: Mapping<U256, Str> = new Mapping<U256, Str>();

  // User (Address) -> Setting Name (String) -> Value (Boolean)
  // Note: This requires nested mapping, see MappingNested documentation

  @External
  mint(tokenId: U256, owner: Address, metadata: Str): void {
    this.owners.set(tokenId, owner);
    this.metadata.set(tokenId, metadata);
    const currentBalance = this.balances.get(owner);
    this.balances.set(owner, currentBalance.add(U256Factory.fromString("1")));
  }

  @View
  getOwner(tokenId: U256): Address {
    return this.owners.get(tokenId);
  }

  @View
  getBalance(owner: Address): U256 {
    return this.balances.get(owner);
  }

  @View
  getMetadata(tokenId: U256): Str {
    return this.metadata.get(tokenId);
  }
}
```

### Example: Voting Contract

This example demonstrates a complete voting system using mappings with structs, simple mappings, and nested mappings:

```typescript
import {
  Address,
  Contract,
  ErrorFactory,
  EventFactory,
  External,
  Mapping,
  MappingNested,
  msg,
  StructTemplate,
  U256,
  U256Factory,
  block,
  StructFactory,
  Str,
} from "@wakeuplabs/as-stylus";

// VoteChoice enum values
const Against = U256Factory.fromString("0");
const For = U256Factory.fromString("1");
const Abstain = U256Factory.fromString("2");

// Errors
const OnlyOwner = ErrorFactory.create<[sender: Address, owner: Address]>();
const BadWindow = ErrorFactory.create<[]>();
const NotFound = ErrorFactory.create<[proposalId: U256]>();
const Closed =
  ErrorFactory.create<[proposalId: U256, startTs: U256, endTs: U256, currentTs: U256]>();
const AlreadyVoted = ErrorFactory.create<[proposalId: U256, voter: Address]>();
const NoWeight = ErrorFactory.create<[]>();

// Events
const PowerSet = EventFactory.create<[user: Address, weight: U256]>({
  indexed: [true, false],
});

const ProposalCreated = EventFactory.create<[id: U256, startTs: U256, endTs: U256]>({
  indexed: [true, false, false],
});

const Voted = EventFactory.create<[id: U256, voter: Address, choice: U256, weight: U256]>({
  indexed: [true, true, false, false],
});

@StructTemplate
export class Proposal {
  id: U256;
  startTs: U256;
  endTs: U256;
  forVotes: U256;
  againstVotes: U256;
  abstainVotes: U256;
}

@Contract
export class Voting {
  owner: Address;
  nextProposalId: U256;
  
  // Mapping with struct value: Proposal ID -> Proposal struct
  proposals: Mapping<U256, Proposal> = new Mapping<U256, Proposal>();
  
  // Simple mappings
  descriptions: Mapping<U256, Str> = new Mapping<U256, Str>();
  power: Mapping<Address, U256> = new Mapping<Address, U256>();
  
  // Nested mapping: Proposal ID -> Voter Address -> Has Voted (boolean)
  voted: MappingNested<U256, Address, boolean> = new MappingNested<U256, Address, boolean>();

  constructor() {
    this.owner = msg.sender;
    this.nextProposalId = U256Factory.fromString("1");
  }

  // Helper function for onlyOwner modifier
  onlyOwner(): void {
    if (!msg.sender.equals(this.owner)) {
      OnlyOwner.revert(msg.sender, this.owner);
    }
  }

  @External
  getOwner(): Address {
    return this.owner;
  }

  @External
  getNextProposalId(): U256 {
    return this.nextProposalId;
  }

  @External
  getPower(user: Address): U256 {
    return this.power.get(user);
  }

  @External
  getProposalDescription(proposalId: U256): Str {
    return this.descriptions.get(proposalId);
  }

  @External
  getVoted(proposalId: U256, voter: Address): boolean {
    return this.voted.get(proposalId, voter);
  }

  @External
  getProposal(proposalId: U256): Proposal {
    return this.proposals.get(proposalId);
  }

  @External
  setPower(user: Address, w: U256): void {
    this.onlyOwner();
    this.power.set(user, w);
    PowerSet.emit(user, w);
  }

  @External
  createProposal(startTs: U256, endTs: U256, description: Str): U256 {
    this.onlyOwner();
    if (endTs.lessThanOrEqual(startTs)) {
      BadWindow.revert();
    }
    const id = this.nextProposalId;
    this.nextProposalId = this.nextProposalId.add(U256Factory.fromString("1"));

    const proposal = StructFactory.create<Proposal>({
      id: id,
      startTs: startTs,
      endTs: endTs,
      forVotes: U256Factory.fromString("0"),
      againstVotes: U256Factory.fromString("0"),
      abstainVotes: U256Factory.fromString("0"),
    });

    this.proposals.set(id, proposal);
    this.descriptions.set(id, description);
    ProposalCreated.emit(id, startTs, endTs);
    return id;
  }

  @External
  vote(proposalId: U256, choice: U256): void {
    const proposal = this.proposals.get(proposalId);
    const zeroId = U256Factory.fromString("0");

    if (proposal.id.equals(zeroId)) {
      NotFound.revert(proposalId);
    }

    const ts = block.timestamp;
    if (ts.lessThan(proposal.startTs) || ts.greaterThan(proposal.endTs)) {
      Closed.revert(proposalId, proposal.startTs, proposal.endTs, ts);
    }

    const hasVoted = this.voted.get(proposalId, msg.sender);
    if (hasVoted) {
      AlreadyVoted.revert(proposalId, msg.sender);
    }

    const w = this.power.get(msg.sender);
    if (w.equals(U256Factory.fromString("0"))) {
      NoWeight.revert();
    }

    this.voted.set(proposalId, msg.sender, true);

    if (choice.equals(For)) {
      proposal.forVotes = proposal.forVotes.add(w);
    } else if (choice.equals(Against)) {
      proposal.againstVotes = proposal.againstVotes.add(w);
    } else {
      proposal.abstainVotes = proposal.abstainVotes.add(w);
    }

    this.proposals.set(proposalId, proposal);
    Voted.emit(proposalId, msg.sender, choice, w);
  }
}
```

This voting contract demonstrates:

- **Mapping with structs**: `proposals: Mapping<U256, Proposal>` stores complex proposal data
- **Simple mappings**: `power` and `descriptions` for user voting power and proposal descriptions
- **Nested mapping**: `voted` tracks which users have voted on which proposals
- **Struct modification**: Retrieving, modifying, and storing structs back to the mapping
- **Integration**: How mappings work together with events, errors, and other contract features

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation />
