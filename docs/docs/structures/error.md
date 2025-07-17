# @Error Decorator

The `@Error` decorator defines custom error types that can be thrown to revert transactions with structured error data. Custom errors provide better error handling than simple reverts.

## Syntax

```typescript
@Error
class ErrorName {
  field1: Type1;
  field2: Type2;
}

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
@Error
class InsufficientBalance {
  requested: U256;
  available: U256;
}

@Error
class InvalidAddress {
  providedAddress: Address;
}

@Contract
export class SimpleContract {
  static balance: U256;

  @External
  static withdraw(amount: U256): void {
    // Check if amount is valid
    if (amount.greaterThan(SimpleContract.balance)) {
      InsufficientBalance.revert(amount, SimpleContract.balance);
    }
    
    // Update balance
    SimpleContract.balance = SimpleContract.balance.sub(amount);
  }

  @External
  static setBalance(newBalance: U256, targetAddress: Address): void {
    // Validate address
    if (targetAddress.isZero()) {
      InvalidAddress.revert(targetAddress);
    }
    
    SimpleContract.balance = newBalance;
  }
}
```

## Error Types

```typescript
@Error
class SimpleError {
  code: U256;
  message: String;
  user: Address;
  active: Boolean;
}

@Contract
export class ErrorContract {
  @External
  static doSomething(code: U256, user: Address): void {
    if (code.equal(U256Factory.create())) {
      const message = StrFactory.fromString("Invalid code");
      SimpleError.revert(code, message, user, false);
    }
  }
}
```

---

import { StructureNavigation } from '@site/src/components/NavigationGrid';

<StructureNavigation /> 