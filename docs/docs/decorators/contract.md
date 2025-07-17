# @Contract Decorator

The `@Contract` decorator is the foundational decorator that marks a TypeScript class as a smart contract. Every smart contract must have exactly one class decorated with `@Contract`.

## Syntax

```typescript
@Contract
export class MyContract {
  // Contract implementation
}
```

## Purpose

The `@Contract` decorator:

- **Identifies Contract Classes**: Tells the compiler which class represents the smart contract
- **Enables Contract Features**: Allows the use of other decorators like `@External`, `@View`, etc.
- **Generates Entry Points**: Creates the necessary WASM entry points for Stylus execution
- **ABI Generation**: Enables automatic ABI (Application Binary Interface) generation

## Rules and Constraints

### Single Contract Rule
- **One per file**: Each contract file must contain exactly one `@Contract` decorated class
- **No multiple contracts**: Multiple `@Contract` decorators in the same file will cause compilation errors

```typescript
// ✅ Valid - Single contract
@Contract
export class MyContract {
  // Implementation
}

// ❌ Invalid - Multiple contracts
@Contract
export class FirstContract { }

@Contract  // Error: Multiple contracts not allowed
export class SecondContract { }
```

### Class Structure
- **Export Required**: The contract class must be exported
- **Static Members**: Contract storage and methods should typically be static
- **Constructor Support**: Optional constructor for initialization logic

## Basic Example

```typescript
@Contract
export class SimpleStorage {
  static value: U256;

  constructor() {
    SimpleStorage.value = U256Factory.create();
  }

  @External
  static setValue(newValue: U256): void {
    SimpleStorage.value = newValue;
  }

  @View
  static getValue(): U256 {
    return SimpleStorage.value;
  }
}
```

## Advanced Usage

### With Storage Variables

```typescript
@Contract
export class TokenContract {
  // Contract storage
  static totalSupply: U256;
  static balances: Mapping<Address, U256>;
  static allowances: Mapping<Address, Mapping<Address, U256>>;

  constructor() {
    TokenContract.totalSupply = U256Factory.fromString("1000000");
    // Initialize mappings as needed
  }

  @External
  static transfer(to: Address, amount: U256): void {
    // Transfer logic
  }
}
```

### With Events and Errors

```typescript
@Event
class Transfer {
  from: Address;
  to: Address;
  amount: U256;
}

@Error
class InsufficientBalance {
  requested: U256;
  available: U256;
}

@Contract
export class AdvancedToken {
  static balances: Mapping<Address, U256>;

  @External
  static transfer(to: Address, amount: U256): void {
    const sender = msg.sender();
    const balance = AdvancedToken.balances.get(sender);
    
    if (balance.lessThan(amount)) {
      InsufficientBalance.revert(amount, balance);
    }

    // Perform transfer
    AdvancedToken.balances.set(sender, balance.sub(amount));
    AdvancedToken.balances.set(to, AdvancedToken.balances.get(to).add(amount));
    
    // Emit event
    Transfer.emit(sender, to, amount);
  }
}
```

## Compilation Process

When you use `@Contract`, the compiler:

1. **Validates Structure**: Ensures only one contract per file
2. **Processes Methods**: Identifies `@External`, `@View`, and other decorated methods
3. **Generates Entry Points**: Creates WASM entry points for external methods
4. **Creates ABI**: Generates JSON ABI for external interaction
5. **Optimizes Code**: Performs AssemblyScript optimizations for Stylus

## Error Messages

Common compilation errors related to `@Contract`:

```typescript
// Error: "No contract decorator found"
export class MyContract { } // Missing @Contract

// Error: "Multiple contracts found"
@Contract
export class First { }
@Contract
export class Second { } // Not allowed

// Error: "Multiple contract decorators found"
@Contract
@Contract  // Duplicate decorator
export class MyContract { }
```

## Best Practices

1. **Single Responsibility**: Each contract should have a single, well-defined purpose
2. **Clear Naming**: Use descriptive class names that reflect the contract's functionality
3. **Export Pattern**: Always export your contract class for proper compilation
4. **Documentation**: Add comments to describe the contract's purpose and behavior

```typescript
/**
 * ERC20 Token implementation with mint/burn functionality
 * Supports standard ERC20 operations with additional governance features
 */
@Contract
export class GovernanceToken {
  // Implementation
}
```

## Related Decorators

- [`@External`](external.md) - For public contract methods
- [`@View`](view.md) - For read-only methods
- [`@Event`](event.md) - For event definitions
- [`@Error`](error.md) - For custom error types

The `@Contract` decorator is your starting point for smart contract development with AssemblyScript Stylus SDK! 