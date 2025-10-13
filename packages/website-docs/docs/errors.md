# Errors

Custom errors provide a structured way to revert transactions with meaningful error information.

## Overview

The AssemblyScript Stylus SDK uses `ErrorFactory` to define custom error types that can be thrown to revert transactions with structured data. Custom errors help developers and users understand why a transaction failed.

## Creating Errors

Use `ErrorFactory.create()` to define error structures:

```typescript
import { ErrorFactory, U256, Address } from "@wakeuplabs/as-stylus";

const InsufficientBalance = ErrorFactory.create<[amount: U256, balance: U256]>();
const Unauthorized = ErrorFactory.create<[user: Address]>();
```

### Syntax

```typescript
const ErrorName = ErrorFactory.create<[Type1, Type2, Type3]>();
```

- Define error parameter types that will be passed when the error is thrown
- All parameters are passed to the error when reverting

## Reverting with Errors

Call the `.revert()` method on your error with the appropriate parameters:

```typescript
// Simple revert
Unauthorized.revert(msg.sender);

// Multiple parameters
InsufficientBalance.revert(requestedAmount, availableBalance);

// With constructed values
InvalidParameter.revert(StrFactory.fromString("amount"), providedValue, maxValue);
```

## Basic Example

```typescript
import { Contract, External, U256, ErrorFactory } from "@wakeuplabs/as-stylus";

const InsufficientBalance = ErrorFactory.create<[amount: U256, balance: U256]>();

@Contract
export class Wallet {
  balance: U256;

  @External
  withdraw(amount: U256): void {
    if (amount.greaterThan(this.balance)) {
      // Revert with custom error showing requested and available amounts
      InsufficientBalance.revert(amount, this.balance);
    }

    this.balance = this.balance.sub(amount);
  }
}
```
