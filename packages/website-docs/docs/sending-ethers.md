# Sending ETH

The AssemblyScript Stylus SDK provides two main ways to send Ether:

1. **Using `CallFactory.transfer()`** - High-level method that reverts on failure
2. **Using `CallFactory.send()`** - Returns boolean, allows manual error handling

### Gas Behavior

**Important:** The `CallFactory.transfer()` method supplies all available gas to the recipient contract, which may subsequently call other contracts or consume the gas. This differs from Solidity's `transfer()` method, which is capped at 2300 gas.

If you need to limit gas (similar to Solidity's behavior), use `CallFactory.send()` which is capped at 2300 gas, or use `CallFactory.call()` with a specified gas limit.

### Method 1: Using `CallFactory.transfer()`

Standard transfer. Suitable for sending to EOAs or contracts with receive functions:

```typescript
import {
  Contract,
  External,
  Payable,
  Address,
  U256,
  CallFactory,
  msg,
} from "@wakeuplabs/as-stylus";

@Contract
export class Sender {
  @External
  @Payable
  sendViaTransfer(to: Address, amount: U256): void {
    CallFactory.transfer(to, amount);
  }
}
```

### Method 2: Using `CallFactory.send()`

Send with 2300 gas limit (similar to Solidity's `.send()`). Returns boolean instead of reverting:

```typescript
import {
  Contract,
  External,
  Payable,
  Address,
  U256,
  CallFactory,
  msg,
} from "@wakeuplabs/as-stylus";

@Contract
export class SafeSender {
  @External
  @Payable
  sendViaSend(to: Address): boolean {
    // Send with 2300 gas limit
    // Returns true/false instead of reverting
    return CallFactory.send(to, msg.value);
  }
}
```
