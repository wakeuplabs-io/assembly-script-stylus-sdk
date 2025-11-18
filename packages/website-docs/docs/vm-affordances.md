# VM Affordances

The AssemblyScript Stylus SDK provides high-level affordances for interacting with the Arbitrum Virtual Machine. They can be imported from `@wakeuplabs/as-stylus`.

```typescript
import { Contract, block, U256, View, Address, msg, contract } from "@wakeuplabs/as-stylus";

@Contract
export class BlockGetters {
  @View
  getBasefee(): U256 {
    return block.basefee;
  }

  @View
  getNumber(): U256 {
    return block.number;
  }

  @View
  getTimestamp(): U256 {
    return block.timestamp;
  }

  @View
  getChainId(): U256 {
    return block.chainId;
  }

  @View
  getCoinbase(): Address {
    return block.coinbase;
  }

  @View
  getGaslimit(): U256 {
    return block.gaslimit;
  }
}
```

## block

Access information about the current block:

- `block.basefee` – current block base fee (`U256`)
- `block.chainId` – Arbitrum chain identifier (`U256`)
- `block.coinbase` – L1 batch poster (coinbase) address (`Address`)
- `block.gaslimit` – block gas limit (`U256`)
- `block.number` – sequencer’s estimate of the L1 block number (`U256`)
- `block.timestamp` – sequencer’s estimate of the block timestamp (`U256`)
- `block.hasBasefee` – boolean helper indicating whether `block.basefee` is non-zero

## msg

Interact with the current call context:

- `msg.sender` – address that invoked the program
- `msg.value` – ETH value (in wei) sent with the call

```typescript
import { msg, Address } from "@wakeuplabs/as-stylus";

export function isOwner(owner: Address): boolean {
  return msg.sender.equals(owner);
}
```

## contract

Access information about the current contract:

- `contract.address` – address of the contract (`Address`)

```typescript
import { contract, Address } from "@wakeuplabs/as-stylus";

@Contract
export class MyContract {
  @View
  getContractAddress(): Address {
    return contract.address;
  }
}
```
