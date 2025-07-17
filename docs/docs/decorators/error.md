# @Error Decorator

The `@Error` decorator defines custom error types that can be thrown to revert transactions with structured error data. Custom errors are more gas-efficient than string-based reverts and provide better error handling.

## Syntax

```typescript
@Error
class ErrorName {
  field1: Type1;
  field2: Type2;
  // ... additional fields
}

// Usage in contract
ErrorName.revert(value1, value2);
```

## Purpose

The `@Error` decorator:

- **Gas Efficiency**: More efficient than string-based error messages
- **Structured Data**: Provides detailed error information
- **Type Safety**: Compile-time validation of error parameters
- **ABI Generation**: Creates proper error ABI entries
- **Debugging**: Better error handling and debugging experience

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

## Error Field Types

### Supported Field Types

```typescript
@Error
class CompleteErrorExample {
  uintValue: U256;      // ✅ 256-bit unsigned integer
  intValue: I256;       // ✅ 256-bit signed integer
  addressValue: Address; // ✅ Ethereum address
  stringValue: String;   // ✅ Dynamic string
  boolValue: Boolean;    // ✅ Boolean value
}

// ❌ Unsupported types
@Error
class InvalidError {
  complexObject: CustomClass;  // Error: Unsupported type
  mapping: Mapping<Address, U256>; // Error: Mappings not allowed
}
```

## Common Error Patterns

### Access Control Errors

```typescript
@Error
class UnauthorizedAccess {
  caller: Address;
  requiredRole: String;
}

@Error
class NotOwner {
  caller: Address;
  owner: Address;
}

@Contract
export class AccessControlled {
  static owner: Address;
  static roles: Mapping<Address, String>;

  @External
  static restrictedFunction(): void {
    const caller = msg.sender();
    
    if (!caller.equals(AccessControlled.owner)) {
      NotOwner.revert(caller, AccessControlled.owner);
    }
    
    // Function logic...
  }

  @External
  static roleRestrictedFunction(): void {
    const caller = msg.sender();
    const role = AccessControlled.roles.get(caller);
    
    if (!role.equals(String.from("admin"))) {
      UnauthorizedAccess.revert(caller, String.from("admin"));
    }
    
    // Function logic...
  }
}
```

### Validation Errors

```typescript
@Error
class InvalidAmount {
  providedAmount: U256;
  minimumAmount: U256;
  maximumAmount: U256;
}

@Error
class InvalidTimeframe {
  currentTime: U256;
  requiredTime: U256;
  operation: String;
}

@Error
class DuplicateEntry {
  existingId: U256;
  attemptedId: U256;
}

@Contract
export class ValidationContract {
  static minAmount: U256;
  static maxAmount: U256;
  static lockPeriod: U256;
  static entries: Mapping<U256, Boolean>;

  @External
  static deposit(amount: U256): void {
    const min = ValidationContract.minAmount;
    const max = ValidationContract.maxAmount;
    
    if (amount.lessThan(min) || amount.greaterThan(max)) {
      InvalidAmount.revert(amount, min, max);
    }
    
    // Deposit logic...
  }

  @External
  static withdraw(id: U256): void {
    const currentTime = block.timestamp();
    const unlockTime = ValidationContract.getLockTime(id);
    
    if (currentTime.lessThan(unlockTime)) {
      InvalidTimeframe.revert(
        currentTime,
        unlockTime,
        String.from("withdrawal")
      );
    }
    
    // Withdrawal logic...
  }

  @External
  static createEntry(id: U256): void {
    if (ValidationContract.entries.get(id).toValue()) {
      DuplicateEntry.revert(id, id);
    }
    
    ValidationContract.entries.set(id, Boolean.create(true));
  }
}
```

### Business Logic Errors

```typescript
@Error
class InsufficientLiquidity {
  requested: U256;
  available: U256;
  poolId: U256;
}

@Error
class SlippageExceeded {
  expectedAmount: U256;
  actualAmount: U256;
  maxSlippage: U256;
}

@Error
class PositionNotFound {
  positionId: U256;
  owner: Address;
}

@Contract
export class DeFiProtocol {
  static liquidity: Mapping<U256, U256>;
  static positions: Mapping<U256, Position>;

  @External
  static swap(poolId: U256, amountIn: U256, minAmountOut: U256): void {
    const available = DeFiProtocol.liquidity.get(poolId);
    
    if (available.lessThan(amountIn)) {
      InsufficientLiquidity.revert(amountIn, available, poolId);
    }
    
    const amountOut = DeFiProtocol.calculateSwapOutput(poolId, amountIn);
    
    if (amountOut.lessThan(minAmountOut)) {
      SlippageExceeded.revert(minAmountOut, amountOut, 
        minAmountOut.sub(amountOut).mul(U256Factory.fromString("100")).div(minAmountOut));
    }
    
    // Perform swap...
  }

  @External
  static closePosition(positionId: U256): void {
    const caller = msg.sender();
    const position = DeFiProtocol.positions.get(positionId);
    
    if (Address.isZero(position.owner)) {
      PositionNotFound.revert(positionId, caller);
    }
    
    // Close position logic...
  }
}
```

## Advanced Error Handling

### Nested Error Conditions

```typescript
@Error
class TransferFailed {
  from: Address;
  to: Address;
  amount: U256;
  reason: String;
}

@Contract
export class ComplexToken {
  @External
  static complexTransfer(to: Address, amount: U256): void {
    const sender = msg.sender();
    
    try {
      // Multiple validation steps
      ComplexToken.validateAddress(to);
      ComplexToken.validateAmount(amount);
      ComplexToken.validateBalance(sender, amount);
      ComplexToken.performTransfer(sender, to, amount);
    } catch {
      // Catch any validation failure and provide detailed error
      TransferFailed.revert(
        sender,
        to,
        amount,
        String.from("Validation or transfer failed")
      );
    }
  }
}
```

### Error with Context

```typescript
@Error
class OperationFailed {
  operation: String;
  step: U256;
  errorCode: U256;
  additionalInfo: String;
}

@Contract
export class MultiStepProcess {
  @External
  static executeProcess(data: String): void {
    const stepNumber = U256Factory.create();
    
    // Step 1: Validation
    stepNumber = stepNumber.add(U256Factory.fromString("1"));
    if (!MultiStepProcess.validateInput(data)) {
      OperationFailed.revert(
        String.from("executeProcess"),
        stepNumber,
        U256Factory.fromString("1001"),
        String.from("Input validation failed")
      );
    }
    
    // Step 2: Processing
    stepNumber = stepNumber.add(U256Factory.fromString("1"));
    if (!MultiStepProcess.processData(data)) {
      OperationFailed.revert(
        String.from("executeProcess"),
        stepNumber,
        U256Factory.fromString("2001"),
        String.from("Data processing failed")
      );
    }
    
    // Continue with other steps...
  }
}
```

## Error vs String Reverts

### Gas Comparison

```typescript
// ❌ Less efficient - string revert
@External
static inefficientError(): void {
  // This costs more gas
  require(false, "Insufficient balance: requested 100, available 50");
}

// ✅ More efficient - custom error
@External
static efficientError(): void {
  // This costs less gas
  InsufficientBalance.revert(
    U256Factory.fromString("100"),
    U256Factory.fromString("50")
  );
}
```

## ABI Generation

Errors generate ABI entries:

```json
{
  "type": "error",
  "name": "InsufficientBalance",
  "inputs": [
    {
      "name": "requested",
      "type": "uint256"
    },
    {
      "name": "available", 
      "type": "uint256"
    }
  ]
}
```

## Error Handling in External Applications

```javascript
// JavaScript example - handling custom errors
try {
  await contract.transfer(to, amount);
} catch (error) {
  if (error.name === 'InsufficientBalance') {
    console.log(`Insufficient balance: requested ${error.args.requested}, available ${error.args.available}`);
  } else if (error.name === 'InvalidAddress') {
    console.log(`Invalid address: ${error.args.providedAddress}`);
  }
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 