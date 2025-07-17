# Visibility and State Mutability Decorators

Beyond the core `@External` and `@View` decorators, the AssemblyScript Stylus SDK provides additional decorators for fine-grained control over method visibility and state mutability.

## Visibility Decorators

### @Public

The `@Public` decorator marks a method as internally callable within the contract but also accessible from external calls.

```typescript
@Contract
export class PublicExample {
  static internalCounter: U256;

  @Public
  static updateCounter(value: U256): void {
    PublicExample.internalCounter = value;
  }

  @External
  static externalMethod(): void {
    // Can call public methods internally
    PublicExample.updateCounter(U256Factory.fromString("100"));
  }
}
```

### @Internal (Implicit)

Methods without visibility decorators are internal by default:

```typescript
@Contract
export class InternalExample {
  static secretValue: U256;

  // Internal method - no decorator needed
  static calculateSecret(input: U256): U256 {
    return input.mul(U256Factory.fromString("42"));
  }

  @External
  static getProcessedValue(input: U256): U256 {
    // Can call internal methods
    return InternalExample.calculateSecret(input);
  }
}
```

## State Mutability Decorators

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

### Gas Optimization with State Mutability

```typescript
@Contract
export class GasOptimized {
  static expensiveCalculation: U256;

  @Pure
  static cheapCalculation(a: U256, b: U256): U256 {
    // Gas-efficient: no state access
    return a.add(b).mul(U256Factory.fromString("2"));
  }

  @View
  static getCachedResult(): U256 {
    // Gas-efficient for external calls (no gas when called statically)
    return GasOptimized.expensiveCalculation;
  }

  @External
  static updateCache(input: U256): void {
    // Expensive: modifies state
    GasOptimized.expensiveCalculation = GasOptimized.complexCalculation(input);
  }

  static complexCalculation(input: U256): U256 {
    // Internal expensive calculation
    let result = input;
    for (let i = U256Factory.create(); i.lessThan(U256Factory.fromString("100")); i = i.add(U256Factory.fromString("1"))) {
      result = result.mul(U256Factory.fromString("2")).add(U256Factory.fromString("1"));
    }
    return result;
  }
}
```

## Error Messages

Common compilation errors:

```typescript
// Error: "Multiple visibility decorators found"
@External
@Public
static invalidVisibility(): void { }

// Error: "Multiple state mutability decorators found"
@View
@Pure
static invalidMutability(): void { }

// Error: "View method cannot be payable"
@View
@Payable
static invalidViewPayable(): void { }

// Error: "Pure method cannot be payable"
@Pure
@Payable
static invalidPurePayable(): void { }
```

## Best Practices

1. **Choose Appropriate Mutability**: Use the most restrictive mutability possible
2. **Minimize External Methods**: Only expose necessary functionality externally
3. **Use Pure for Utilities**: Mark utility functions as pure when possible
4. **Document Payment Requirements**: Clearly indicate when methods require payment
5. **Consistent Access Patterns**: Use consistent patterns for access control

```typescript
@Contract
export class BestPracticeExample {
  static data: U256;
  static owner: Address;

  // ✅ Pure utility function
  @Pure
  static hash(input: String): U256 {
    return U256.keccak256(input);
  }

  // ✅ View for data access
  @View
  static getData(): U256 {
    return BestPracticeExample.data;
  }

  // ✅ Internal access control helper
  static onlyOwner(): void {
    if (!msg.sender().equals(BestPracticeExample.owner)) {
      NotOwner.revert();
    }
  }

  // ✅ Clear payment requirement
  @Payable
  @External
  static payForService(): void {
    const payment = msg.value();
    if (payment.lessThan(U256Factory.fromString("1000000"))) {
      InsufficientPayment.revert(payment, U256Factory.fromString("1000000"));
    }
    // Service logic...
  }

  // ✅ Restricted state modification
  @External
  static setData(newData: U256): void {
    BestPracticeExample.onlyOwner();
    BestPracticeExample.data = newData;
  }
}
```

## Related Decorators

- [`@External`](external.md) - Primary external method decorator
- [`@View`](view.md) - Read-only method decorator  
- [`@Contract`](contract.md) - Required container
- [`@Event`](event.md) - For event emissions
- [`@Error`](error.md) - For error handling

These additional decorators provide fine-grained control over your contract's interface and behavior! 