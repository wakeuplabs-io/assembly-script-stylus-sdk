# State Mutability

### @Pure

The `@Pure` decorator indicates that a method doesn't read or modify contract state. Pure functions only use their parameters and constants.

```typescript
@Contract
export class MathLibrary {
  @Pure
  static add(a: U256, b: U256): U256 {
    return a.add(b);  // Only uses parameters
  }

  @Pure
  static factorial(n: U256): U256 {
    let result = U256Factory.fromString("1");
    let i = U256Factory.fromString("1");
    
    while (i.lessThanOrEqual(n)) {
      result = result.mul(i);
      i = i.add(U256Factory.fromString("1"));
    }
    
    return result;
  }

  @Pure
  static max(a: U256, b: U256): U256 {
    return a.greaterThan(b) ? a : b;
  }
}
```

### @Payable

The `@Payable` decorator allows a method to receive Ether along with the function call.

```typescript
@Contract
export class PayableContract {
  static balance: U256;
  static deposits: Mapping<Address, U256>;

  @Payable
  @External
  static deposit(): void {
    const sender = msg.sender();
    const value = msg.value();
    
    PayableContract.balance = PayableContract.balance.add(value);
    PayableContract.deposits.set(
      sender, 
      PayableContract.deposits.get(sender).add(value)
    );
    
    DepositReceived.emit(sender, value);
  }

  @Payable
  @External
  static buyTokens(amount: U256): void {
    const payment = msg.value();
    const required = amount.mul(U256Factory.fromString("1000")); // 1000 wei per token
    
    if (payment.lessThan(required)) {
      InsufficientPayment.revert(payment, required);
    }

    // Issue tokens logic...
    TokensPurchased.emit(msg.sender(), amount, payment);
  }
}
```

### @Nonpayable (Default)

Methods without payment decorators are nonpayable by default and will revert if sent Ether:

```typescript
@Contract
export class NonpayableExample {
  @External  // Implicitly @Nonpayable
  static normalFunction(): void {
    // This will revert if called with Ether
  }

  @Nonpayable  // Explicit declaration
  @External
  static explicitNonpayable(): void {
    // Also rejects Ether payments
  }
}
```

## Decorator Combinations

### Valid Combinations

```typescript
@Contract
export class CombinationExamples {
  // External + View (read-only external access)
  @External
  @View
  static getPublicData(): U256 {
    return SomeContract.publicValue;
  }

  // External + Pure (stateless external function)
  @External
  @Pure
  static calculateHash(data: String): U256 {
    return U256.hash(data);
  }

  // External + Payable (accepts payments)
  @External
  @Payable
  static acceptPayment(): void {
    // Handle payment
  }

  // Public + View (internal + external read-only)
  @Public
  @View
  static internalOrExternalRead(): U256 {
    return SomeContract.value;
  }
}
```

### Invalid Combinations

```typescript
// ❌ Cannot combine View with Payable
@View
@Payable
@External
static invalidCombination(): void { }

// ❌ Cannot combine Pure with Payable
@Pure
@Payable
@External
static anotherInvalidCombination(): U256 { }

// ❌ Cannot have multiple visibility decorators
@External
@Public
static multipleVisibility(): void { }
```

## Decorator Hierarchy

### State Mutability Order (from most to least restrictive):

1. **@Pure** - No state access, only parameters and constants
2. **@View** - Read-only state access
3. **@Nonpayable** - Can modify state, no Ether accepted
4. **@Payable** - Can modify state and accept Ether

```typescript
@Contract
export class StateHierarchy {
  static value: U256;

  @Pure
  static pureFunction(x: U256): U256 {
    return x.mul(U256Factory.fromString("2"));  // ✅ Only uses parameters
    // return StateHierarchy.value;  // ❌ Cannot read state
  }

  @View
  static viewFunction(): U256 {
    return StateHierarchy.value;  // ✅ Can read state
    // StateHierarchy.value = U256Factory.create();  // ❌ Cannot modify state
  }

  @External
  static nonpayableFunction(): void {
    StateHierarchy.value = U256Factory.fromString("100");  // ✅ Can modify state
    // const payment = msg.value();  // ❌ Will be zero
  }

  @Payable
  @External
  static payableFunction(): void {
    StateHierarchy.value = U256Factory.fromString("200");  // ✅ Can modify state
    const payment = msg.value();  // ✅ Can receive Ether
  }
}
```

## Advanced Usage Patterns

### Access Control with Visibility

```typescript
@Contract
export class AccessControlledContract {
  static owner: Address;
  static admins: Mapping<Address, Boolean>;

  // Internal helper for access control
  static requireOwner(): void {
    if (!msg.sender().equals(AccessControlledContract.owner)) {
      NotOwner.revert(msg.sender(), AccessControlledContract.owner);
    }
  }

  // Internal helper for admin access
  static requireAdmin(): void {
    if (!AccessControlledContract.admins.get(msg.sender()).toValue()) {
      NotAdmin.revert(msg.sender());
    }
  }

  @External
  static ownerOnlyFunction(): void {
    AccessControlledContract.requireOwner();
    // Owner-only logic
  }

  @Public
  static adminFunction(): void {
    AccessControlledContract.requireAdmin();
    // Admin function that can also be called internally
  }

  @External
  static publicFunction(): void {
    // Call admin function internally
    AccessControlledContract.adminFunction();
  }
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation /> 