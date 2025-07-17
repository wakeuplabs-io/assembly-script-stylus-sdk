# String - Dynamic Text Type

The `String` type represents dynamic, UTF-8 encoded text data in AssemblyScript Stylus smart contracts. It provides basic string operations essential for text handling and display in smart contracts.

## Import

```typescript
import { String, StrFactory } from '@as-stylus/as-stylus';
```

## Overview

String provides:
- UTF-8 encoded text representation
- Basic string creation and manipulation
- Length property for string measurements
- Slice operation for substring extraction
- String conversion capabilities

## Available Operations

Based on the available transformers, String supports these operations:

### Factory Methods
- `StrFactory.create(): String` - Create new String instance (likely empty)
- `StrFactory.fromString(value: string): String` - Create from string literal

### Core Operations
- `.toString(): string` - Convert to native string representation
- `.slice(start: number, end?: number): String` - Extract substring
- `.length: number` - Get string length property

## Creation and Basic Usage

### Creating String Values

```typescript
import { String, StrFactory } from '@as-stylus/as-stylus';

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

// Get string length
const length = text.length;        // 18

// Convert to native string
const nativeStr = text.toString(); // "Hello, Blockchain!"

// Extract substring using slice
const hello = text.slice(0, 5);        // "Hello"
const blockchain = text.slice(7, 17);  // "Blockchain"
const fromMiddle = text.slice(7);       // "Blockchain!" (to end)
```

## Contract Integration

### Storage Operations

```typescript
import { Storage } from '@as-stylus/as-stylus';

@Contract
class Registry {
    private name: Storage<String>;
    private description: Storage<String>;
    
    constructor() {
        this.name = new Storage<String>();
        this.description = new Storage<String>();
        
        // Initialize with default values
        this.name.set(StrFactory.fromString("Default Registry"));
        this.description.set(StrFactory.fromString("A basic registry contract"));
    }
    
    @External
    setName(newName: String): void {
        this.requireOwner();
        
        // Basic validation - check if not empty
        if (newName.length == 0) {
            revert("Name cannot be empty");
        }
        
        // Limit name length
        if (newName.length > 50) {
            revert("Name too long");
        }
        
        this.name.set(newName);
        
        // Emit event
        const event = new NameChanged();
        event.newName = newName;
        event.emit();
    }
    
    @External
    setDescription(newDescription: String): void {
        this.requireOwner();
        
        if (newDescription.length > 200) {
            revert("Description too long");
        }
        
        this.description.set(newDescription);
    }
    
    @View
    getName(): String {
        return this.name.get();
    }
    
    @View
    getDescription(): String {
        return this.description.get();
    }
    
    @View
    getNameLength(): number {
        return this.name.get().length;
    }
    
    @View
    getShortName(): String {
        const fullName = this.name.get();
        
        // Return first 10 characters if name is too long
        if (fullName.length > 10) {
            return fullName.slice(0, 10);
        }
        
        return fullName;
    }
}
```

### Event Logging with Strings

```typescript
@Event
class NameChanged {
    newName: String;
}

@Event
class MessagePosted {
    author: Address;
    message: String;
}

@Event
class StatusUpdate {
    user: Address;
    oldStatus: String;
    newStatus: String;
}

// Usage in contract methods
@External
postMessage(content: String): void {
    // Basic validation
    if (content.length == 0) {
        revert("Message cannot be empty");
    }
    
    if (content.length > 280) { // Twitter-like limit
        revert("Message too long");
    }
    
    const caller = getCaller();
    
    // Store message logic here...
    
    // Emit event
    const event = new MessagePosted();
    event.author = caller;
    event.message = content;
    event.emit();
}
```

## String Manipulation Patterns

### Basic Text Processing

```typescript
function truncateString(input: String, maxLength: number): String {
    if (input.length <= maxLength) {
        return input;
    }
    
    return input.slice(0, maxLength);
}

function getFirstWord(input: String): String {
    // Simple implementation - find first part before space
    // Note: Without indexOf, this is limited
    const maxSearch = input.length < 20 ? input.length : 20;
    
    for (let i = 0; i < maxSearch; i++) {
        const char = input.slice(i, i + 1);
        if (char.toString() == " ") {
            return input.slice(0, i);
        }
    }
    
    return input; // No space found
}

function getFileExtension(filename: String): String {
    // Get last 4 characters (assuming .ext format)
    if (filename.length < 4) {
        return StrFactory.create(); // Empty string
    }
    
    return filename.slice(filename.length - 4);
}
```

### String Validation

```typescript
function validateTokenSymbol(symbol: String): boolean {
    // Check length (typically 3-5 characters)
    if (symbol.length < 3 || symbol.length > 5) {
        return false;
    }
    
    // Additional validation would need character checking
    // which is not easily possible with current operations
    return true;
}

function isValidLength(input: String, minLength: number, maxLength: number): boolean {
    return input.length >= minLength && input.length <= maxLength;
}

function isEmpty(input: String): boolean {
    return input.length == 0;
}
```

## Error Handling

### String-related Errors

```typescript
@Error
class InvalidStringLength {
    provided: number;
    minLength: number;
    maxLength: number;
}

@Error
class EmptyStringNotAllowed {
    fieldName: String;
}

// Usage in validation functions
function requireStringLength(input: String, minLen: number, maxLen: number): void {
    if (input.length < minLen || input.length > maxLen) {
        const error = new InvalidStringLength();
        error.provided = input.length;
        error.minLength = minLen;
        error.maxLength = maxLen;
        error.revert();
    }
}

function requireNonEmpty(input: String, fieldName: String): void {
    if (input.length == 0) {
        const error = new EmptyStringNotAllowed();
        error.fieldName = fieldName;
        error.revert();
    }
}
```

---

import { TypeNavigation } from '@site/src/components/NavigationGrid';

<TypeNavigation /> 