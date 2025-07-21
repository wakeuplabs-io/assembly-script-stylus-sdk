# String - Dynamic Text Type

The `Str` type represents dynamic, UTF-8 encoded text data in AssemblyScript Stylus smart contracts. It provides basic string operations essential for text handling and display in smart contracts.

## Import

```typescript
import { Str, StrFactory } from '@as-stylus/as-stylus';
```

## Overview

Str provides:
- UTF-8 encoded text representation
- Basic string creation and manipulation
- Length operations for string measurements
- Slice operation for substring extraction
- String conversion capabilities

## Available Operations

Based on the available transformers, Str supports these operations:

### Factory Methods
- `StrFactory.create(): Str` - Create new Str instance (empty)
- `StrFactory.fromString(value: string): Str` - Create from string literal

### Core Operations
- `.toString(): string` - Convert to native string representation
- `.slice(start: U256, length: U256): string` - Extract substring
- Automatic conversion for return values

## Creation and Basic Usage

### Creating String Values

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Str, StrFactory } from '@as-stylus/as-stylus';

// Create empty string
const empty = StrFactory.create();

// Create from string literal
const greeting = StrFactory.fromString("Hello, World!");
const message = StrFactory.fromString("Contract initialized successfully");

// Create short strings
const symbol = StrFactory.fromString("ETH");
const name = StrFactory.fromString("Ethereum");
```

### Basic Operations

```typescript
const text = StrFactory.fromString("Hello, Blockchain!");

// Convert to native string
const nativeStr = text.toString(); // "Hello, Blockchain!"

// Extract substring using slice
const hello = text.slice(U256Factory.create(), U256Factory.fromString("5"));     // "Hello"
const blockchain = text.slice(U256Factory.fromString("7"), U256Factory.fromString("10")); // "Blockchain"
```

## Contract Integration

### String Storage

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Error
export class InvalidStringLength {
  provided: Str;
  maxLength: U256;
}

@Error
export class EmptyStringNotAllowed {
  fieldName: Str;
}

@Event
export class NameChanged {
  newName: Str;
}

@Event
export class MessagePosted {
  author: Address;
  message: Str;
}

@Contract
export class StringStorage {
  static storageVal: Str;
  static name: Str;
  static description: Str;

  constructor(initialName: string) {
    storageVal = StrFactory.create();
    name = StrFactory.fromString(initialName);
    description = StrFactory.fromString("Default description");
  }

  @External
  static setStorage(value: string): void {
    const s = StrFactory.fromString(value);
    storageVal = s;
  }

  @External
  static setName(newName: string): void {
    const nameStr = StrFactory.fromString(newName);
    
    // Basic validation - check if not empty
    if (newName.length == 0) {
      EmptyStringNotAllowed.revert(StrFactory.fromString("name"));
    }
    
    // Limit name length
    if (newName.length > 50) {
      InvalidStringLength.revert(nameStr, U256Factory.fromString("50"));
    }
    
    name = nameStr;
    
    // Emit event
    NameChanged.emit(nameStr);
  }

  @External
  static setDescription(newDescription: string): void {
    if (newDescription.length > 200) {
      const descStr = StrFactory.fromString(newDescription);
      InvalidStringLength.revert(descStr, U256Factory.fromString("200"));
    }
    
    description = StrFactory.fromString(newDescription);
  }

  @View
  static getStorage(): string {
    return storageVal;
  }

  @View
  static getName(): string {
    return name;
  }

  @View
  static getDescription(): string {
    return description;
  }

  @View
  static substring(offset: U256, length: U256): string {
    return storageVal.slice(offset, length);
  }
}
```

### Message System

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class MessageBoard {
  static messages: Mapping<U256, Str> = new Mapping<U256, Str>();
  static authors: Mapping<U256, Address> = new Mapping<U256, Address>();
  static messageCount: U256;

  constructor() {
    messageCount = U256Factory.create();
  }

  @External
  static postMessage(content: string): void {
    // Basic validation
    if (content.length == 0) {
      EmptyStringNotAllowed.revert(StrFactory.fromString("message"));
    }
    
    if (content.length > 280) { // Twitter-like limit
      const contentStr = StrFactory.fromString(content);
      InvalidStringLength.revert(contentStr, U256Factory.fromString("280"));
    }
    
    const caller = msg.sender;
    const contentStr = StrFactory.fromString(content);
    
    // Store message
    messages.set(messageCount, contentStr);
    authors.set(messageCount, caller);
    
    // Emit event
    MessagePosted.emit(caller, contentStr);
    
    // Increment counter
    const one = U256Factory.fromString("1");
    messageCount = messageCount.add(one);
  }

  @View
  static getMessage(id: U256): string {
    return messages.get(id);
  }

  @View
  static getAuthor(id: U256): Address {
    return authors.get(id);
  }

  @View
  static getMessageCount(): U256 {
    return messageCount;
  }

  @View
  static getLatestMessage(): string {
    if (messageCount.equals(U256Factory.create())) {
      return ""; // No messages
    }
    
    const lastIndex = messageCount.sub(U256Factory.fromString("1"));
    return messages.get(lastIndex);
  }
}
```

## String Manipulation Patterns

### Basic Text Processing

```typescript
function truncateString(input: Str, maxLength: U256): Str {
  const inputStr = input.toString();
  const maxLengthNum = parseInt(maxLength.toString());
  
  if (inputStr.length <= maxLengthNum) {
    return input;
  }
  
  return StrFactory.fromString(inputStr.substring(0, maxLengthNum));
}

function isEmpty(input: Str): boolean {
  return input.toString().length == 0;
}

function getStringLength(input: Str): U256 {
  const length = input.toString().length;
  return U256Factory.fromString(length.toString());
}
```

### String Validation

```typescript
function validateTokenSymbol(symbol: string): boolean {
  // Check length (typically 3-5 characters)
  if (symbol.length < 3 || symbol.length > 5) {
    return false;
  }
  
  return true;
}

function isValidLength(input: string, minLength: number, maxLength: number): boolean {
  return input.length >= minLength && input.length <= maxLength;
}

function requireNonEmpty(input: string, fieldName: string): void {
  if (input.length == 0) {
    EmptyStringNotAllowed.revert(StrFactory.fromString(fieldName));
  }
}
```

## String Registry

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class NameRegistry {
  static names: Mapping<Address, Str> = new Mapping<Address, Str>();
  static addresses: Mapping<Str, Address> = new Mapping<Str, Address>();

  @External
  static registerName(name: string): void {
    requireNonEmpty(name, "name");
    
    if (name.length > 32) {
      const nameStr = StrFactory.fromString(name);
      InvalidStringLength.revert(nameStr, U256Factory.fromString("32"));
    }

    const caller = msg.sender;
    const nameStr = StrFactory.fromString(name);
    
    // Check if name is already taken
    const existingAddr = addresses.get(nameStr);
    if (!existingAddr.isZero()) {
      // Name already taken
      return;
    }

    // Register name
    names.set(caller, nameStr);
    addresses.set(nameStr, caller);
    
    NameChanged.emit(nameStr);
  }

  @View
  static resolveName(name: string): Address {
    const nameStr = StrFactory.fromString(name);
    return addresses.get(nameStr);
  }

  @View
  static getNameOf(addr: Address): string {
    return names.get(addr);
  }

  @View
  static isNameTaken(name: string): boolean {
    const nameStr = StrFactory.fromString(name);
    const addr = addresses.get(nameStr);
    return !addr.isZero();
  }
}
```

## Error Handling

### String-related Errors

```typescript
// Validation function with custom errors
function requireStringLength(input: string, minLen: number, maxLen: number): void {
  if (input.length < minLen || input.length > maxLen) {
    const inputStr = StrFactory.fromString(input);
    const maxLengthU256 = U256Factory.fromString(maxLen.toString());
    InvalidStringLength.revert(inputStr, maxLengthU256);
  }
}

function requireNonEmptyField(input: string, fieldName: string): void {
  if (input.length == 0) {
    const fieldStr = StrFactory.fromString(fieldName);
    EmptyStringNotAllowed.revert(fieldStr);
  }
}
```

## Best Practices

### ✅ Do
- Use `StrFactory.fromString()` to create strings from literals
- Validate length before storing
- Use native strings for validation logic
- Convert to Str only for storage
- Validate inputs before processing

### ❌ Avoid
- Storing extremely long strings
- Not validating input length
- Multiple unnecessary conversions
- Complex string operations in contracts

### Recommended Limits
- Token symbols: 3-5 characters
- Names: maximum 32 characters  
- Descriptions: maximum 200 characters
- Messages: maximum 280 characters

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 