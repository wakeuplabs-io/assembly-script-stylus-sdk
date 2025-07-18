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
- `AddressFactory.create(): Address` - Create new Address instance (likely zero address)
- `AddressFactory.fromString(hex: string): Address` - Create from hex string

## Creation and Basic Usage

### Creating Address Values

```typescript
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
const caller = getCaller(); // Assuming this function exists in your context

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
@Contract
class AccessControlled {
    private owner: Storage<Address>;
    
    constructor() {
        this.owner = new Storage<Address>();
        // Set deployer as owner (assuming msg.sender equivalent exists)
        this.owner.set(getCaller());
    }
    
    @External
    transferOwnership(newOwner: Address): void {
        this.requireOwner();
        this.requireValidAddress(newOwner);
        
        const oldOwner = this.owner.get();
        this.owner.set(newOwner);
        
        // Emit ownership transfer event
        const event = new OwnershipTransferred();
        event.previousOwner = oldOwner;
        event.newOwner = newOwner;
        event.emit();
    }
    
    @View
    isOwner(addr: Address): boolean {
        return addr.equals(this.owner.get());
    }
    
    @View
    getOwner(): Address {
        return this.owner.get().clone();
    }
    
    // Access control helper
    private requireOwner(): void {
        const caller = getCaller();
        const owner = this.owner.get();
        
        if (!caller.equals(owner)) {
            revert("Caller is not the owner");
        }
    }
    
    private requireValidAddress(addr: Address): void {
        if (addr.isZero()) {
            revert("Address cannot be zero");
        }
    }
}
```

### Address Registry

```typescript
@Contract
class AddressRegistry {
    private registry: Storage<Mapping<string, Address>>;
    
    constructor() {
        this.registry = new Storage<Mapping<string, Address>>();
    }
    
    @External
    registerAddress(name: string, addr: Address): void {
        this.requireOwner();
        this.requireValidAddress(addr);
        
        const registryMap = this.registry.get();
        registryMap.set(name, addr);
        this.registry.set(registryMap);
        
        // Emit registration event
        const event = new AddressRegistered();
        event.name = name;
        event.addr = addr.clone();
        event.emit();
    }
    
    @View
    resolve(name: string): Address {
        const registryMap = this.registry.get();
        if (!registryMap.has(name)) {
            return AddressFactory.create(); // Return zero address
        }
        return registryMap.get(name).clone();
    }
    
    @View
    isRegistered(name: string): boolean {
        const addr = this.resolve(name);
        return !addr.isZero();
    }
    
    private requireValidAddress(addr: Address): void {
        if (addr.isZero()) {
            revert("Address cannot be zero");
        }
    }
}
```

### Event Logging with Addresses

```typescript
@Event
class Transfer {
    from: Address;
    to: Address;
    value: U256;
}

@Event
class OwnershipTransferred {
    previousOwner: Address;
    newOwner: Address;
}

@Event
class AddressRegistered {
    name: string;
    addr: Address;
}

// Usage in contract methods
@External
transfer(to: Address, amount: U256): void {
    const from = getCaller();
    
    // Validate addresses
    if (to.isZero()) {
        revert("Cannot transfer to zero address");
    }
    
    if (from.equals(to)) {
        revert("Cannot transfer to self");
    }
    
    // Perform transfer logic...
    
    // Emit transfer event
    const event = new Transfer();
    event.from = from.clone();
    event.to = to.clone();
    event.value = amount;
    event.emit();
}
```

## Validation Patterns

### Address Validation

```typescript
function validateAddressInput(addr: Address): void {
    if (addr.isZero()) {
        revert("Address cannot be zero");
    }
}

function requireContract(addr: Address): void {
    validateAddressInput(addr);
    
    if (!addr.hasCode()) {
        revert("Address is not a contract");
    }
}

function requireEOA(addr: Address): void {
    validateAddressInput(addr);
    
    if (addr.hasCode()) {
        revert("Address must be an externally owned account");
    }
}
```

### Batch Address Operations

```typescript
function validateAddressArray(addresses: Array<Address>): void {
    if (addresses.length == 0) {
        revert("Address array cannot be empty");
    }
    
    for (let i = 0; i < addresses.length; i++) {
        validateAddressInput(addresses[i]);
        
        // Check for duplicates
        for (let j = i + 1; j < addresses.length; j++) {
            if (addresses[i].equals(addresses[j])) {
                revert(`Duplicate address at positions ${i} and ${j}`);
            }
        }
    }
}

function containsAddress(addresses: Array<Address>, target: Address): boolean {
    for (let i = 0; i < addresses.length; i++) {
        if (addresses[i].equals(target)) {
            return true;
        }
    }
    return false;
}
```

## Error Handling

### Address-related Errors

```typescript
@Error
class InvalidAddress {
    providedAddress: Address;
    reason: string;
}

@Error  
class UnauthorizedAccess {
    caller: Address;
    requiredAddress: Address;
}

@Error
class AddressNotFound {
    searchAddress: Address;
}

// Usage in contract methods
function validateAndThrow(addr: Address): void {
    if (addr.isZero()) {
        const error = new InvalidAddress();
        error.providedAddress = addr.clone();
        error.reason = "Address cannot be zero";
        error.revert();
    }
}

function requireSpecificAddress(caller: Address, required: Address): void {
    if (!caller.equals(required)) {
        const error = new UnauthorizedAccess();
        error.caller = caller.clone();
        error.requiredAddress = required.clone();
        error.revert();
    }
}
```

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 