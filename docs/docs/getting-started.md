# Getting Started

Welcome to the **AssemblyScript Stylus SDK** documentation! This SDK enables you to develop smart contracts for Arbitrum Stylus using AssemblyScript with a TypeScript-like syntax.

## What is AssemblyScript Stylus SDK?

The AssemblyScript Stylus SDK is a development framework that allows you to write smart contracts using AssemblyScript syntax with TypeScript decorators. It compiles your contracts to WebAssembly (WASM) for execution on Arbitrum Stylus, providing better performance and gas efficiency compared to traditional EVM contracts.

## Key Features

- **TypeScript-like Syntax**: Write contracts using familiar TypeScript decorators and syntax
- **Type Safety**: Strong typing with compile-time validation
- **Performance**: Compiled to WASM for optimal execution on Stylus
- **Rich Type System**: Support for U256, I256, Address, String, Boolean, Mapping, and Struct types
- **Event System**: Emit events with proper ABI encoding
- **Error Handling**: Custom error types with revert functionality

## Quick Start

### Installation

```bash
npm install @as-stylus/sdk
```

### Your First Contract

Create a simple counter contract:

```typescript
@Contract
export class Counter {
  static counter: U256;

  constructor() {
    Counter.counter = U256Factory.create();
  }

  @External
  static increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    Counter.counter = Counter.counter.add(delta);
  }

  @External
  static decrement(): void {
    const delta: U256 = U256Factory.fromString("1");
    Counter.counter = Counter.counter.sub(delta);
  }

  @View
  static get(): U256 {
    return Counter.counter;
  }
}
```

### Building Your Contract

```bash
npx as-stylus build contract.ts
```

This will generate the necessary AssemblyScript code and ABI files for deployment.

## Core Concepts

### Decorators

Decorators define the behavior and visibility of your contract components:

- **@Contract**: Marks a class as a smart contract
- **@External**: Makes methods callable from external transactions
- **@View**: Marks read-only methods that don't modify state
- **@Event**: Defines event structures for logging
- **@Error**: Creates custom error types

### Data Types

The SDK provides several optimized types for blockchain development:

- **U256/I256**: 256-bit unsigned/signed integers
- **Address**: Ethereum addresses with validation
- **String**: Dynamic strings with storage optimization
- **Boolean**: Boolean values with 32-byte storage
- **Mapping**: Key-value storage mappings
- **Struct**: Custom data structures

## Next Steps

- Learn about [Decorators](decorators/contract) to understand contract structure
- Explore [Data Types](types/u256) for efficient data handling
- Check out [Examples](examples/counter) for practical implementations

Ready to build? Let's start with understanding the decorator system! 