# Readonly Constants

Readonly constants are values defined outside of smart contracts that can only be used for `U256` types. They provide a TypeScript enum-like behavior for managing fixed values in your contracts, making code more readable and maintainable.

## Overview

Readonly constants:

- **Defined Outside Contracts**: Must be declared outside of `@Contract` decorated classes
- **U256 Only**: Can only be used with `U256` type values
- **Enum-Like Behavior**: Provide a familiar pattern similar to TypeScript enums
- **Compile-Time Constants**: Values are fixed at compile time
- **Code Organization**: Help organize and document fixed values used throughout your contract

## Syntax

```typescript
const CONSTANT_NAME = U256Factory.fromString("value");
```

## Basic Example

### Access Control with Roles

```typescript
import {
  Address,
  Contract,
  ErrorFactory,
  EventFactory,
  External,
  Internal,
  Mapping,
  U256,
  U256Factory,
  View,
  msg,
} from "@wakeuplabs/as-stylus";

// Readonly constants defined outside the contract
const ROLE_ADMIN = U256Factory.fromString("1");
const ROLE_OPERATOR = U256Factory.fromString("2");

@Contract
export class AccessControl {
  admins: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  operators: Mapping<Address, boolean> = new Mapping<Address, boolean>();

  constructor() {
    this.admins.set(msg.sender, true);
    RoleGranted.emit(ROLE_ADMIN, msg.sender, msg.sender);
  }

  @Internal
  ensureValidRole(role: U256): void {
    if (!role.equals(ROLE_ADMIN) && !role.equals(ROLE_OPERATOR)) {
      AccessControlInvalidRole.revert(role);
    }
  }

  @External
  grantRole(role: U256, account: Address): void {
    this.requireAdmin(msg.sender);
    this.ensureValidRole(role);
    this.ensureValidAccount(account);

    if (role.equals(ROLE_ADMIN)) {
      this.setRoleAdmin(role, account, true);
      return;
    }

    if (role.equals(ROLE_OPERATOR)) {
      this.setRoleOperator(role, account, true);
      return;
    }
  }
}
```
