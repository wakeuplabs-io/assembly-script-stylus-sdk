# Quick Start

:::caution ALPHA VERSION

This SDK is currently in **alpha development** and is actively being worked on. It is **not production-ready** and may contain bugs, breaking changes, or incomplete features. Use at your own risk and avoid deploying to mainnet without thorough testing.

:::

Welcome to the **AssemblyScript Stylus SDK** - a comprehensive development toolkit for creating **Arbitrum Stylus smart contracts** using TypeScript syntax, transpiled to AssemblyScript and compiled to WebAssembly for near-native execution speeds.

## What is AssemblyScript Stylus SDK?

The AssemblyScript Stylus SDK is a complete development framework that allows developers to write smart contracts using familiar TypeScript decorators and syntax. Stylus is Arbitrum's next-generation smart contract platform that enables developers to write contracts in languages other than Solidity, compiling them to WebAssembly for superior performance and gas efficiency.

## Requirements

- **Node.js** >= 18.x
- **AssemblyScript** >= 0.27.x
- **cargo stylus** (Rust CLI tool for Stylus validation and deployment)

## Prerequisites

Make sure you have the required tools installed before getting started.

### Quick Install (convenience)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Install Rust + rustup (skip if already installed). Then source `"$HOME/.cargo/env"`.

### Rust Setup (in order)

cargo-stylus requires Rust 1.81+ and the wasm32-unknown-unknown target.

```bash
rustup update
```

Update rustup and installed toolchains.

```bash
rustup default stable
```

Use stable toolchain by default.

```bash
rustc --version
```

Verify version (cargo-stylus requires Rust ≥ 1.81).

```bash
rustup target add wasm32-unknown-unknown
```

Add WASM target (mandatory for Stylus).

### Install cargo-stylus

```bash
cargo install cargo-stylus
```

Install the Stylus CLI (latest version published on crates.io).

## Generate a new project

Create a new contract project with built-in scaffolding:

```bash
npx @wakeuplabs/as-stylus generate my-contract
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
import { Contract, External, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

@Contract
export class Counter {
  counter: U256;

  constructor() {
    this.counter = U256Factory.create();
  }

  @External
  set(value: U256): void {
    this.counter = value;
  }

  @External
  increment(): void {
    const delta: U256 = U256Factory.fromString("1");
    this.counter = this.counter.addUnchecked(delta);
  }

  @External
  decrement(): void {
    const delta: U256 = U256Factory.fromString("1");
    this.counter = this.counter.subUnchecked(delta);
  }

  @View
  get(): U256 {
    return this.counter;
  }
}
```

## Build and Deploy

Compile your contract to WebAssembly and validate it for Stylus:

```bash
# build artifacts, Compile to WASM and check Validate with cargo stylus
npx @wakeuplabs/as-stylus compile contract.ts --endpoint <RPC_URL>
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
- [Interactive Playground](https://as-stylus-playground.wakeuplabs.link/) - Test concepts in your browser
