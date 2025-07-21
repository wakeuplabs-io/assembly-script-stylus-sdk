# Boolean - Logical Value Type

The `boolean` type represents logical true/false values in AssemblyScript Stylus smart contracts. It's essential for conditional logic, access control, and state flags.

## Overview

Boolean provides:
- True/false logical values
- Conditional logic operations
- State flag management
- Access control patterns
- Simple comparison results

## Basic Usage

### Creating Boolean Values

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// Direct boolean values
const isActive: boolean = true;
const isComplete: boolean = false;

// From comparisons
const isGreater: boolean = valueA > valueB;
const isEqual: boolean = addressA.equals(addressB);
```

## Contract Integration

### Simple State Flags

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Event
export class StatusChanged {
  newStatus: boolean;
}

@Contract
export class SimpleFlag {
  static isEnabled: boolean;

  constructor() {
    isEnabled = false; // Initialize as disabled
  }

  @External
  static enable(): void {
    isEnabled = true;
    StatusChanged.emit(true);
  }

  @External
  static disable(): void {
    isEnabled = false;
    StatusChanged.emit(false);
  }

  @External
  static toggle(): void {
    isEnabled = !isEnabled;
    StatusChanged.emit(isEnabled);
  }

  @View
  static getStatus(): boolean {
    return isEnabled;
  }

  @View
  static isActive(): boolean {
    return isEnabled;
  }
}
```

### Access Control with Flags

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Error
export class ContractPaused {
  // Error without additional fields
}

@Error
export class Unauthorized {
  caller: Address;
}

@Contract
export class AccessControlContract {
  static owner: Address;
  static isPaused: boolean;
  static emergencyStop: boolean;
  static maintenanceMode: boolean;

  constructor() {
    owner = msg.sender;
    isPaused = false;
    emergencyStop = false;
    maintenanceMode = false;
  }

  @External
  static pause(): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    isPaused = true;
  }

  @External
  static unpause(): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    isPaused = false;
  }

  @External
  static setEmergencyStop(status: boolean): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    emergencyStop = status;
  }

  @External
  static setMaintenanceMode(status: boolean): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    maintenanceMode = status;
  }

  @External
  static criticalFunction(): void {
    // Check multiple conditions
    if (isPaused || emergencyStop || maintenanceMode) {
      ContractPaused.revert();
    }
    
    // Critical logic here...
  }

  @View
  static getStatus(): boolean {
    return isPaused;
  }

  @View
  static isOperational(): boolean {
    return !isPaused && !emergencyStop && !maintenanceMode;
  }

  @View
  static getFullStatus(): boolean[] {
    const status: boolean[] = [];
    status.push(isPaused);
    status.push(emergencyStop);
    status.push(maintenanceMode);
    return status;
  }
}
```

## Logical Operations

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class BooleanLogic {
  static flag1: boolean;
  static flag2: boolean;
  static flag3: boolean;

  constructor() {
    flag1 = false;
    flag2 = false;
    flag3 = true;
  }

  @External
  static setFlag1(value: boolean): void {
    flag1 = value;
  }

  @External
  static setFlag2(value: boolean): void {
    flag2 = value;
  }

  @External
  static setFlag3(value: boolean): void {
    flag3 = value;
  }

  @View
  static checkBoth(): boolean {
    return flag1 && flag2;
  }

  @View
  static checkEither(): boolean {
    return flag1 || flag2;
  }

  @View
  static checkNot(): boolean {
    return !flag1;
  }

  @View
  static checkAll(): boolean {
    return flag1 && flag2 && flag3;
  }

  @View
  static checkAny(): boolean {
    return flag1 || flag2 || flag3;
  }

  @View
  static checkExactly(target: boolean): boolean {
    return flag1 == target && flag2 == target && flag3 == target;
  }

  @View
  static countTrue(): U256 {
    let count = U256Factory.create();
    const one = U256Factory.fromString("1");
    
    if (flag1) count = count.add(one);
    if (flag2) count = count.add(one);
    if (flag3) count = count.add(one);
    
    return count;
  }
}
```

### Permission System

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class PermissionSystem {
  static owner: Address;
  static permissions: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  static globalPermissions: Mapping<Address, boolean> = new Mapping<Address, boolean>();

  constructor() {
    owner = msg.sender;
    // Owner has permissions by default
    permissions.set(owner, true);
    globalPermissions.set(owner, true);
  }

  @External
  static grantPermission(user: Address): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    permissions.set(user, true);
  }

  @External
  static revokePermission(user: Address): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    permissions.set(user, false);
  }

  @External
  static grantGlobalPermission(user: Address): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    globalPermissions.set(user, true);
  }

  @External
  static protectedFunction(): void {
    const hasPermission = permissions.get(msg.sender);
    if (!hasPermission) {
      Unauthorized.revert(msg.sender);
    }
    
    // Protected function here...
  }

  @External
  static superProtectedFunction(): void {
    const hasGlobal = globalPermissions.get(msg.sender);
    const hasRegular = permissions.get(msg.sender);
    
    if (!hasGlobal || !hasRegular) {
      Unauthorized.revert(msg.sender);
    }
    
    // Super protected function here...
  }

  @View
  static hasPermission(user: Address): boolean {
    return permissions.get(user);
  }

  @View
  static hasGlobalPermission(user: Address): boolean {
    return globalPermissions.get(user);
  }

  @View
  static hasAnyPermission(user: Address): boolean {
    return permissions.get(user) || globalPermissions.get(user);
  }

  @View
  static hasAllPermissions(user: Address): boolean {
    return permissions.get(user) && globalPermissions.get(user);
  }
}
```

### Simple Voting

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Event
export class VoteCast {
  voter: Address;
  vote: boolean;
}

@Event
export class ProposalClosed {
  passed: boolean;
  yesVotes: U256;
  noVotes: U256;
}

@Contract
export class SimpleVoting {
  static owner: Address;
  static votingOpen: boolean;
  static proposalPassed: boolean;
  static hasVoted: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  static votes: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  static yesCount: U256;
  static noCount: U256;

  constructor() {
    owner = msg.sender;
    votingOpen = false;
    proposalPassed = false;
    yesCount = U256Factory.create();
    noCount = U256Factory.create();
  }

  @External
  static openVoting(): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    votingOpen = true;
  }

  @External
  static closeVoting(): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender);
    }
    votingOpen = false;
    
    // Determine if proposal passed
    proposalPassed = yesCount > noCount;
    
    ProposalClosed.emit(proposalPassed, yesCount, noCount);
  }

  @External
  static vote(support: boolean): void {
    if (!votingOpen) {
      ContractPaused.revert();
    }

    const voter = msg.sender;
    const alreadyVoted = hasVoted.get(voter);
    
    if (alreadyVoted) {
      return; // Already voted
    }

    // Register vote
    hasVoted.set(voter, true);
    votes.set(voter, support);

    // Update counters
    const one = U256Factory.fromString("1");
    if (support) {
      yesCount = yesCount.add(one);
    } else {
      noCount = noCount.add(one);
    }

    VoteCast.emit(voter, support);
  }

  @View
  static getVote(voter: Address): boolean {
    return votes.get(voter);
  }

  @View
  static hasUserVoted(voter: Address): boolean {
    return hasVoted.get(voter);
  }

  @View
  static isVotingOpen(): boolean {
    return votingOpen;
  }

  @View
  static didProposalPass(): boolean {
    return proposalPassed;
  }

  @View
  static getResults(): U256[] {
    const results: U256[] = [];
    results.push(yesCount);
    results.push(noCount);
    return results;
  }
}
```

## Best Practices

### ✅ Do
- Initialize boolean variables explicitly in constructors
- Use descriptive names for flags (`isEnabled`, `hasPermission`)
- Combine multiple boolean checks in validation functions
- Emit events when important states change
- Use logical operators for complex conditions

### ❌ Avoid
- Leaving boolean variables uninitialized
- Using redundant comparisons (`flag == true` instead of `flag`)
- Overly complex conditional logic inline
- Not documenting the meaning of each boolean flag

### Common Patterns
- **Paused/Active**: Contract state control
- **Permissions**: User access control
- **State flags**: System condition tracking
- **Voting**: Binary decision recording

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 