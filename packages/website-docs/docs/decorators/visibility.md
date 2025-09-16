# State Mutability

### @Pure

The `@Pure` decorator indicates that a method doesn't read or modify contract state. Pure functions only use their parameters and constants.

```typescript
import { Contract, Pure, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class MathLibrary {
  @Pure
  add(a: U256, b: U256): U256 {
    return a.add(b); // Only uses parameters
  }

  @Pure
  factorial(n: U256): U256 {
    let result = U256Factory.fromString("1");
    let i = U256Factory.fromString("1");

    while (i.lessThanOrEqual(n)) {
      result = result.mul(i);
      i = i.add(U256Factory.fromString("1"));
    }

    return result;
  }

  @Pure
  max(a: U256, b: U256): U256 {
    return a.greaterThan(b) ? a : b;
  }
}
```

### @Payable

The `@Payable` decorator allows a method to receive Ether along with the function call.

```typescript
import {
  Contract,
  U256,
  Mapping,
  Address,
  U256Factory,
  Payable,
  Pure,
  External,
} from "@wakeuplabs/as-stylus";

// Define events

@Contract
export class PayableContract {
  balance: U256;
  deposits: Mapping<Address, U256>;

  @Payable
  @External
  deposit(): void {
    const sender = msg.sender();
    const value = msg.value();

    this.balance = this.balance.add(value);
    this.deposits.set(sender, this.deposits.get(sender).add(value));

    DepositReceived.emit(sender, value);
  }

  @Payable
  @External
  buyTokens(amount: U256): void {
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
import { Contract, Payable, External, Nonpayable } from "@wakeuplabs/as-stylus";

@Contract
export class NonpayableExample {
  @External // Implicitly @Nonpayable
  normalFunction(): void {
    // This will revert if called with Ether
  }

  @Nonpayable // Explicit declaration
  @External
  explicitNonpayable(): void {
    // Also rejects Ether payments
  }
}
```

## Decorator Combinations

### Valid Combinations

```typescript
import { Contract, Public, View, External, Pure, Payable, U256 } from "@wakeuplabs/as-stylus";

@Contract
export class CombinationExamples {
  // External + View (read-only external access)
  @External
  @View
  getPublicData(): U256 {
    return SomeContract.publicValue;
  }

  // External + Pure (stateless external function)
  @External
  @Pure
  calculateHash(data: String): U256 {
    return U256.hash(data);
  }

  // External + Payable (accepts payments)
  @External
  @Payable
  acceptPayment(): void {
    // Handle payment
  }

  // Public + View (internal + external read-only)
  @Public
  @View
  internalOrExternalRead(): U256 {
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
invalidCombination(): void { }

// ❌ Cannot combine Pure with Payable
@Pure
@Payable
@External
anotherInvalidCombination(): U256 { }

// ❌ Cannot have multiple visibility decorators
@External
@Public
multipleVisibility(): void { }
```

## Decorator Hierarchy

### State Mutability Order (from most to least restrictive):

1. **@Pure** - No state access, only parameters and constants
2. **@View** - Read-only state access
3. **@Nonpayable** - Can modify state, no Ether accepted
4. **@Payable** - Can modify state and accept Ether

```typescript
import {
  Contract,
  Pure,
  View,
  External,
  Payable,
  Public,
  U256,
  U256Factory,
} from "@wakeuplabs/as-stylus";

@Contract
export class StateHierarchy {
  value: U256;

  @Pure
  pureFunction(x: U256): U256 {
    return x.mul(U256Factory.fromString("2")); // ✅ Only uses parameters
    // return this.value;  // ❌ Cannot read state
  }

  @View
  viewFunction(): U256 {
    return this.value; // ✅ Can read state
    // this.value = U256Factory.create();  // ❌ Cannot modify state
  }

  @External
  nonpayableFunction(): void {
    this.value = U256Factory.fromString("100"); // ✅ Can modify state
    // const payment = msg.value();  // ❌ Will be zero
  }

  @Payable
  @External
  payableFunction(): void {
    this.value = U256Factory.fromString("200"); // ✅ Can modify state
    const payment = msg.value(); // ✅ Can receive Ether
  }
}
```

## Advanced Usage Patterns

### Access Control with Visibility

```typescript
import {
  Contract,
  Pure,
  View,
  External,
  Payable,
  Public,
  U256,
  Address,
  Mapping,
  U256Factory,
} from "@wakeuplabs/as-stylus";

// Define errors

@Contract
export class AccessControlledContract {
  owner: Address;
  admins: Mapping<Address, boolean>;

  // Internal helper for access control
  requireOwner(): void {
    if (!msg.sender().equals(this.owner)) {
      NotOwner.revert(msg.sender(), this.owner);
    }
  }

  // Internal helper for admin access
  requireAdmin(): void {
    if (!this.admins.get(msg.sender()).toValue()) {
      NotAdmin.revert(msg.sender());
    }
  }

  @External
  ownerOnlyFunction(): void {
    this.requireOwner();
    // Owner-only logic
  }

  @Public
  adminFunction(): void {
    this.requireAdmin();
    // Admin function that can also be called internally
  }

  @External
  publicFunction(): void {
    // Call admin function internally
    this.adminFunction();
  }
}
```

---

import { DecoratorNavigation } from '@site/src/components/NavigationGrid';

<DecoratorNavigation />
