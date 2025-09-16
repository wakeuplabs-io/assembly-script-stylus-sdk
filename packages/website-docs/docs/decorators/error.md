# @Error

The `ErrorFactory` defines custom error types that can be thrown to revert transactions with structured error data. Custom errors provide better error handling than simple reverts.

## Import

```typescript
import { ErrorFactory } from "@wakeuplabs/as-stylus";
```

## Syntax

```typescript
const ErrorName = ErrorFactory.create<[field1: Type1, field2: Type2]>();

// Usage in contract
ErrorName.revert(value1, value2);
```

## Purpose

Errors provide:

- Custom error definitions
- Structured error data
- Transaction reverting

## Basic Example

```typescript
import { Contract, External, U256, Address, ErrorFactory } from "@wakeuplabs/as-stylus";

const InsufficientBalance = ErrorFactory.create<[requested: U256, available: U256]>();
const InvalidAddress = ErrorFactory.create<[providedAddress: Address]>();

@Contract
export class SimpleContract {
  balance: U256;

  @External
  withdraw(amount: U256): void {
    // Check if amount is valid
    if (amount.greaterThan(this.balance)) {
      InsufficientBalance.revert(amount, this.balance);
    }

    // Update balance
    this.balance = this.balance.sub(amount);
  }

  @External
  setBalance(newBalance: U256, targetAddress: Address): void {
    // Validate address
    if (targetAddress.isZero()) {
      InvalidAddress.revert(targetAddress);
    }

    this.balance = newBalance;
  }
}
```

## Error Types

```typescript
import {
  Contract,
  External,
  U256,
  Address,
  Str,
  ErrorFactory,
  StrFactory,
  U256Factory,
} from "@wakeuplabs/as-stylus";

const SimpleError = ErrorFactory.create<[code: U256, messageStr, user: Address, active: boolean]>();

@Contract
export class ErrorContract {
  @External
  doSomething(code: U256, user: Address): void {
    if (code.equals(U256Factory.create())) {
      const message = StrFactory.fromString("Invalid code");
      SimpleError.revert(code, message, user, false);
    }
  }
}
```

## Complex Error Examples

```typescript
import { Contract, External, U256, Address, Str, ErrorFactory } from "@wakeuplabs/as-stylus";

// Multiple parameter errors
const TransferFailed =
  ErrorFactory.create<[from: Address, to: Address, amount: U256, reason: Str]>();
const AccessDenied = ErrorFactory.create<[caller: Address, requiredRole: Str]>();
const InvalidParameter =
  ErrorFactory.create<[paramNameStr, providedValue: U256, maxAllowed: U256]>();

@Contract
export class AdvancedContract {
  owner: Address;
  balances: Mapping<Address, U256>;

  @External
  transfer(to: Address, amount: U256): void {
    const caller = msg.sender;
    const balance = this.balances.get(caller);

    if (balance.lessThan(amount)) {
      const reason = StrFactory.fromString("Insufficient balance");
      TransferFailed.revert(caller, to, amount, reason);
    }

    // Transfer logic...
  }

  @External
  adminFunction(): void {
    const caller = msg.sender;
    if (!caller.equals(this.owner)) {
      const role = StrFactory.fromString("ADMIN");
      AccessDenied.revert(caller, role);
    }

    // Admin logic...
  }
}
```

## Error Validation Patterns

```typescript
import { ErrorFactory, U256Factory, StrFactory } from "@wakeuplabs/as-stylus";

const ValidationError = ErrorFactory.create<[fieldStr, value: U256, constraint: Str]>();

// Helper validation functions
function requirePositive(value: U256, fieldName: string): void {
  if (value.equals(U256Factory.create())) {
    const field = StrFactory.fromString(fieldName);
    const constraint = StrFactory.fromString("must be positive");
    ValidationError.revert(field, value, constraint);
  }
}

function requireMaxValue(value: U256, max: U256, fieldName: string): void {
  if (value.greaterThan(max)) {
    const field = StrFactory.fromString(fieldName);
    const constraint = StrFactory.fromString("exceeds maximum");
    ValidationError.revert(field, value, constraint);
  }
}
```

```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation />
```
