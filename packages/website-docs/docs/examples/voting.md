# Voting Contract

A complete example of a voting system implementation using the AssemblyScript Stylus SDK. This contract demonstrates the use of mappings with structs, simple mappings, and nested mappings.

> **Complete Demo Project**: You can view the full voting dApp implementation with frontend [**here**](https://github.com/wakeuplabs-io/as-stylus-demo-voting).

## Contract Structure

### Vote Choices

Enum-like constants for voting options:

```typescript
const Against = U256Factory.fromString("0");
const For = U256Factory.fromString("1");
const Abstain = U256Factory.fromString("2");
```

### Errors

Custom error types for contract validation:

```typescript
const OnlyOwner = ErrorFactory.create<[sender: Address, owner: Address]>();
const BadWindow = ErrorFactory.create<[]>();
const NotFound = ErrorFactory.create<[proposalId: U256]>();
const Closed = ErrorFactory.create<[proposalId: U256, startTs: U256, endTs: U256, currentTs: U256]>();
const AlreadyVoted = ErrorFactory.create<[proposalId: U256, voter: Address]>();
const NoWeight = ErrorFactory.create<[]>();
```

### Events

Events for tracking voting activity:

```typescript
const PowerSet = EventFactory.create<[user: Address, weight: U256]>({
  indexed: [true, false],
});

const ProposalCreated = EventFactory.create<[id: U256, startTs: U256, endTs: U256]>({
  indexed: [true, false, false],
});

const Voted = EventFactory.create<[id: U256, voter: Address, choice: U256, weight: U256]>({
  indexed: [true, true, false, false],
});
```

### Struct Definition

The `Proposal` struct stores voting data:

```typescript
@StructTemplate
export class Proposal {
  id: U256;
  startTs: U256;
  endTs: U256;
  forVotes: U256;
  againstVotes: U256;
  abstainVotes: U256;
}
```

### Storage State

State variables using different mapping types:

```typescript
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
}
```

### Constructor

Initializes the contract with owner and proposal counter:

```typescript
  constructor() {
    this.owner = msg.sender;
    this.nextProposalId = U256Factory.fromString("1");
  }
```

### Access Control

Helper function for owner-only operations:

```typescript
  onlyOwner(): void {
    if (!msg.sender.equals(this.owner)) {
      OnlyOwner.revert(msg.sender, this.owner);
    }
  }
```

### View Functions

Read-only methods for querying contract state:

```typescript
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
```

### Setting Voting Power

Allows the owner to set voting power for users:

```typescript
  @External
  setPower(user: Address, w: U256): void {
    this.onlyOwner();
    this.power.set(user, w);
    PowerSet.emit(user, w);
  }
```

### Creating Proposals

Creates a new voting proposal with time window:

```typescript
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
```

### Voting

Allows users to vote on proposals:

```typescript
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
```

## Complete Contract

Here's the complete contract implementation:

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

## Key Features Demonstrated

This voting contract showcases:

- **Mapping with structs**: `proposals: Mapping<U256, Proposal>` stores complex proposal data
- **Simple mappings**: `power` and `descriptions` for user voting power and proposal descriptions
- **Nested mapping**: `voted` tracks which users have voted on which proposals
- **Struct modification**: Retrieving, modifying, and storing structs back to the mapping
- **Error handling**: Custom errors for validation and security
- **Event emission**: Tracking important contract state changes
- **Access control**: Owner-only functions for administrative operations
- **Time-based logic**: Using `block.timestamp` for proposal time windows
