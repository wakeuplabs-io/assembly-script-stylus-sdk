# @External Decorator

The `@External` decorator marks a method as publicly callable from outside the contract. External methods can be invoked through transactions and are included in the contract's ABI.

## Syntax

```typescript
@External
static methodName(param1: Type1, param2: Type2): ReturnType {
  // Method implementation
}
```

## Purpose

The `@External` decorator:

- **Public Interface**: Makes methods callable from external transactions
- **ABI Generation**: Includes the method in the contract's ABI
- **Gas Consumption**: Methods consume gas when called
- **State Modification**: Can read and modify contract state
- **Transaction Required**: Must be called within a transaction context

## Basic Example

```typescript
@Contract
export class SimpleStorage {
  static value: U256;

  @External
  static setValue(newValue: U256): void {
    SimpleStorage.value = newValue;
  }

  @External
  static increment(): void {
    const one = U256Factory.fromString("1");
    SimpleStorage.value = SimpleStorage.value.add(one);
  }
}
```

## Rules and Constraints

### Method Requirements
- **Static Methods**: External methods must be static
- **Within Contract**: Can only be used inside `@Contract` decorated classes
- **Supported Types**: Parameters and return types must be supported by the ABI system

### Type Support
Supported parameter and return types:

```typescript
@External
static examples(
  uintValue: U256,          // ✅ Unsigned 256-bit integer
  intValue: I256,           // ✅ Signed 256-bit integer  
  addressValue: Address,    // ✅ Ethereum address
  stringValue: String,      // ✅ Dynamic string
  boolValue: Boolean        // ✅ Boolean value
): U256 {                   // ✅ Any supported type as return
  // Implementation
  return uintValue;
}

// ❌ Unsupported types
@External
static invalid(complexObject: CustomClass): void { } // Error
```

## Advanced Usage

### With Parameter Validation

```typescript
@Contract
export class TokenContract {
  static balances: Mapping<Address, U256>;

  @External
  static transfer(to: Address, amount: U256): void {
    const sender = msg.sender();
    
    // Validate parameters
    if (Address.isZero(to)) {
      TransferToZeroAddress.revert();
    }
    
    if (amount.isZero()) {
      InvalidAmount.revert();
    }

    // Perform transfer logic
    const senderBalance = TokenContract.balances.get(sender);
    if (senderBalance.lessThan(amount)) {
      InsufficientBalance.revert();
    }

    TokenContract.balances.set(sender, senderBalance.sub(amount));
    TokenContract.balances.set(to, TokenContract.balances.get(to).add(amount));
    
    Transfer.emit(sender, to, amount);
  }
}
```

### With Return Values

```typescript
@Contract
export class Calculator {
  @External
  static add(a: U256, b: U256): U256 {
    return a.add(b);
  }

  @External
  static multiply(a: U256, b: U256): U256 {
    return a.mul(b);
  }

  @External
  static getComplexResult(input: U256): Struct<CalculationResult> {
    const result = new CalculationResult();
    result.value = input.mul(U256Factory.fromString("2"));
    result.timestamp = block.timestamp();
    return result;
  }
}
```

### With Events and Error Handling

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
export class ERC20Token {
  static balances: Mapping<Address, U256>;
  static totalSupply: U256;

  @External
  static mint(to: Address, amount: U256): void {
    TokenContract.balances.set(to, TokenContract.balances.get(to).add(amount));
    TokenContract.totalSupply = TokenContract.totalSupply.add(amount);
    
    // Emit transfer from zero address (mint)
    Transfer.emit(Address.zero(), to, amount);
  }

  @External
  static burn(amount: U256): void {
    const sender = msg.sender();
    const balance = TokenContract.balances.get(sender);
    
    if (balance.lessThan(amount)) {
      InsufficientBalance.revert(amount, balance);
    }

    TokenContract.balances.set(sender, balance.sub(amount));
    TokenContract.totalSupply = TokenContract.totalSupply.sub(amount);
    
    // Emit transfer to zero address (burn)
    Transfer.emit(sender, Address.zero(), amount);
  }
}
```



---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 