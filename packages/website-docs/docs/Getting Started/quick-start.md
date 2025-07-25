# Quick Start
<!--
This SDK is currently in **alpha development** and is actively being worked on. It is **not production-ready** and may contain bugs, breaking changes, or incomplete features. Use at your own risk and avoid deploying to mainnet without thorough testing.
--> 
:::caution ALPHA VERSION

This SDK is **not intended for use at this stage**.  
It is in early alpha development, unstable, and subject to major breaking changes.  
**Do not use this SDK in any production, staging, or testnet environments.**  
We strongly advise against integrating or deploying this code until a stable release is announced.

:::

Welcome to the **AssemblyScript Stylus SDK** - a comprehensive development toolkit for creating **Arbitrum Stylus smart contracts** using TypeScript syntax, transpiled to AssemblyScript and compiled to WebAssembly for near-native execution speeds.

## What is AssemblyScript Stylus SDK?

The AssemblyScript Stylus SDK is a complete development framework that allows developers to write smart contracts using familiar TypeScript decorators and syntax. Stylus is Arbitrum's next-generation smart contract platform that enables developers to write contracts in languages other than Solidity, compiling them to WebAssembly for superior performance and gas efficiency.

## Requirements

- **Node.js** >= 18.x
- **AssemblyScript** >= 0.27.x
- **cargo stylus** (Rust CLI tool for Stylus validation and deployment)

## Installation

Install the CLI globally to get started:

```bash
npm install -g as-stylus
```

## Generate a New Project

Create a new contract project with built-in scaffolding:

```bash
as-stylus generate my-contract
cd my-contract
```

This creates a complete project structure with:
- Contract template
- Configuration files
- Package dependencies
- Build scripts

## Your First Contract

The generator creates a simple counter contract for you:

```typescript
@Contract
export class Counter {
  static counter: U256;

  constructor() {
    counter = U256Factory.create();
  }

  @External
  static increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    counter = counter.add(delta);
  }

  @External
  static decrement(): void {
    const delta: U256 = U256Factory.fromString("1");
    counter = counter.sub(delta);
  }

  @View
  static get(): U256 {
    return counter;
  }
}
```

## Build and Deploy

Compile your contract to WebAssembly and validate it for Stylus:

```bash
as-stylus compile contract.ts --endpoint <RPC_URL>
```

Deploy to Arbitrum:

```bash
npm run deploy contract.ts --private-key <PRIVATE_KEY> --endpoint <RPC_URL> --constructor-args <constructor-args...>"
```

## Clean Artifacts

```bash
npm run clean
```

This command will remove all the artifact folder.

## Next Steps

Ready to dive deeper? Check out the [Project Breakdown](project-breakdown) to understand the SDK's architecture and components, or explore our comprehensive guides:

- [Decorators](/decorators/contract) - Define contract structure and behavior
- [Data Types](/types/u256) - Master blockchain-optimized types
- [ERC20 Example](/examples/erc20) - Token contract implementation
<!-- - [Interactive Playground](https://as-stylus-playground.wakeuplabs.link/) - Test concepts in your browser --> 