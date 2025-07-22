# Address - Ethereum Address Type

The `Address` type represents a 20-byte Ethereum address, used for identifying accounts, contracts, and other entities on the Ethereum blockchain. It's a fundamental type for smart contract interaction and access control in AssemblyScript Stylus.

## Import

```typescript
import { Address, AddressFactory } from '@as-stylus/as-stylus';
```

## Overview

Address provides:
- 20-byte (160-bit) Ethereum address representation
- Basic comparison and validation operations
- String conversion for display
- Clone functionality for copying addresses
- Contract code detection

## Available Operations

Based on the interface, Address supports these operations:

### Core Operations
- `clone(): Address` - Create a copy of the address
- `toString(): string` - Convert to string representation
- `isZero(): boolean` - Check if address is zero (null address)
- `equals(other: Address): boolean` - Compare with another address
- `hasCode(): boolean` - Check if address contains contract code

### Factory Methods
- `AddressFactory.create(): Address` - Create new Address instance (zero address)
- `AddressFactory.fromString(hex: string): Address` - Create from hex string

## Creation and Basic Usage

### Creating Address Values

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Address, AddressFactory } from '@as-stylus/as-stylus';

// Create zero address
const zeroAddr = AddressFactory.create();

// Create from hex string
const userAddress = AddressFactory.fromString("0x742d35Cc6634C0532925a3b8D93BEFD738C1234A");
const contractAddr = AddressFactory.fromString("0xA0b86a33E6417c2C1d9B77B1F77E2a3c71234567");
```

### Basic Operations

```typescript
// Address validation
function isValidAddress(addr: Address): boolean {
  return !addr.isZero();
}

// Address comparison
const owner = AddressFactory.fromString("0x742d35Cc6634C0532925a3b8D93BEFD738C1234A");
const caller = msg.sender;

const isOwner = caller.equals(owner);
const isNotZero = !caller.isZero();

// Convert to string representation
const addressString = owner.toString(); // "0x742d35cc6634c0532925a3b8d93befd738c1234a"

// Clone address
const ownerCopy = owner.clone();

// Check if address is a contract
const isContract = contractAddr.hasCode();
```

## Contract Integration

### Access Control

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Error
export class Unauthorized {
  caller: Address;
  required: Address;
}

@Error
export class InvalidAddress {
  address: Address;
}

@Event
export class OwnershipTransferred {
  previousOwner: Address;
  newOwner: Address;
}

@Contract
export class AccessControlled {
  static owner: Address;

  constructor(initialOwner: Address) {
    owner = initialOwner;
  }

  @External
  static transferOwnership(newOwner: Address): void {
    // Check that caller is the owner
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    // Validate new address
    if (newOwner.isZero()) {
      InvalidAddress.revert(newOwner);
    }

    const oldOwner = owner;
    owner = newOwner;

    // Emit ownership transfer event
    OwnershipTransferred.emit(oldOwner, newOwner);
  }

  @External
  static renounceOwnership(): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    const oldOwner = owner;
    owner = AddressFactory.create(); // Zero address

    OwnershipTransferred.emit(oldOwner, owner);
  }

  @View
  static isOwner(addr: Address): boolean {
    return addr.equals(owner);
  }

  @View
  static getOwner(): Address {
    return owner.clone();
  }
}
```

### Address Registry

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Event
export class AddressRegistered {
  name: Str;
  addr: Address;
}

@Event
export class AddressRemoved {
  name: Str;
  addr: Address;
}

@Contract
export class AddressRegistry {
  static owner: Address;
  static registry: Mapping<Str, Address> = new Mapping<Str, Address>();
  static reverseRegistry: Mapping<Address, Str> = new Mapping<Address, Str>();

  constructor() {
    owner = msg.sender;
  }

  @External
  static registerAddress(name: string, addr: Address): void {
    // Only owner can register addresses
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    if (addr.isZero()) {
      InvalidAddress.revert(addr);
    }

    const nameStr = StrFactory.fromString(name);
    
    // Register in both mappings
    registry.set(nameStr, addr);
    reverseRegistry.set(addr, nameStr);

    // Emit event
    AddressRegistered.emit(nameStr, addr);
  }

  @External
  static removeAddress(name: string): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    const nameStr = StrFactory.fromString(name);
    const addr = registry.get(nameStr);
    
    if (addr.isZero()) {
      return; // Doesn't exist
    }

    // Remove from both mappings
    registry.set(nameStr, AddressFactory.create());
    reverseRegistry.set(addr, StrFactory.create());

    AddressRemoved.emit(nameStr, addr);
  }

  @View
  static resolve(name: string): Address {
    const nameStr = StrFactory.fromString(name);
    return registry.get(nameStr);
  }

  @View
  static reverseLookup(addr: Address): string {
    return reverseRegistry.get(addr);
  }

  @View
  static isRegistered(name: string): boolean {
    const addr = this.resolve(name);
    return !addr.isZero();
  }
}
```

### Basic ERC20 System

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Contract
export class SimpleToken {
  static totalSupply: U256;
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();

  constructor(supply: U256) {
    totalSupply = supply;
    balances.set(msg.sender, supply);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;

    // Validate destination address
    if (to.isZero()) {
      return false;
    }

    // Check that it's not the same address
    if (sender.equals(to)) {
      return false;
    }

    const senderBalance = balances.get(sender);

    // Check sufficient balance
    if (senderBalance < amount) {
      return false;
    }

    // Perform transfer
    balances.set(sender, senderBalance.sub(amount));
    const receiverBalance = balances.get(to);
    balances.set(to, receiverBalance.add(amount));

    // Emit event
    Transfer.emit(sender, to, amount);
    return true;
  }

  @View
  static balanceOf(account: Address): U256 {
    return balances.get(account);
  }

  @View
  static getTotalSupply(): U256 {
    return totalSupply;
  }
}
```

## Validation Patterns

### Address Validation

```typescript
function validateAddressInput(addr: Address): void {
  if (addr.isZero()) {
    InvalidAddress.revert(addr);
  }
}

function requireContract(addr: Address): void {
  validateAddressInput(addr);
  
  if (!addr.hasCode()) {
    // Create custom error for EOA when contract expected
    InvalidAddress.revert(addr);
  }
}

function requireEOA(addr: Address): void {
  validateAddressInput(addr);
  
  if (addr.hasCode()) {
    // Create custom error for contract when EOA expected
    InvalidAddress.revert(addr);
  }
}
```

### Batch Address Operations

```typescript
function validateAddressArray(addresses: Address[]): void {
  if (addresses.length == 0) {
    return; // Empty array is valid
  }
  
  for (let i = 0; i < addresses.length; i++) {
    validateAddressInput(addresses[i]);
    
    // Check for duplicates
    for (let j = i + 1; j < addresses.length; j++) {
      if (addresses[i].equals(addresses[j])) {
        // Create custom error for duplicates
        InvalidAddress.revert(addresses[i]);
      }
    }
  }
}

function containsAddress(addresses: Address[], target: Address): boolean {
  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i].equals(target)) {
      return true;
    }
  }
  return false;
}
```

## Whitelist/Blacklist

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class Whitelist {
  static owner: Address;
  static whitelist: Mapping<Address, boolean> = new Mapping<Address, boolean>();

  constructor() {
    owner = msg.sender;
  }

  @External
  static addToWhitelist(addr: Address): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    if (addr.isZero()) {
      InvalidAddress.revert(addr);
    }

    whitelist.set(addr, true);
  }

  @External
  static removeFromWhitelist(addr: Address): void {
    if (!msg.sender.equals(owner)) {
      Unauthorized.revert(msg.sender, owner);
    }

    whitelist.set(addr, false);
  }

  @View
  static isWhitelisted(addr: Address): boolean {
    return whitelist.get(addr);
  }

  @External
  static requireWhitelisted(addr: Address): void {
    if (!whitelist.get(addr)) {
      Unauthorized.revert(addr, owner);
    }
  }
}
```

## Error Handling

### Address-related Errors

```typescript
function validateAndThrow(addr: Address): void {
  if (addr.isZero()) {
    InvalidAddress.revert(addr);
  }
}

function requireSpecificAddress(caller: Address, required: Address): void {
  if (!caller.equals(required)) {
    Unauthorized.revert(caller, required);
  }
}

function requireNotZeroAddress(addr: Address): void {
  if (addr.isZero()) {
    InvalidAddress.revert(addr);
  }
}
```

## Best Practices

### ✅ Do
- Always validate that addresses are not zero before using them
- Use `equals()` to compare addresses
- Use `clone()` to create copies of addresses when needed
- Check that caller has permissions before sensitive operations
- Emit events for important changes (ownership transfers, etc.)

### ❌ Avoid
- Comparing addresses with `==` or `!=` operators
- Accepting zero addresses without validation
- Not checking permissions in administrative functions
- Operations without logging events

### Security Patterns
- Access control: Check `msg.sender` against roles/permissions
- Input validation: Always check for zero addresses
- Events: Log important changes for auditability
- Cloning: Use `clone()` to avoid shared references

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 